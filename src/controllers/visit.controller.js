const mongoose = require("mongoose");
const VisitModel = require("../models/Visit");
const PatientModel = require("../models/Patient");

// ================= CREATE VISIT =================
const createVisit = async (req, res, next) => {
  try {
    const { patient } = req.body;

    const existingPatient = await PatientModel.findById(patient);
    if (!existingPatient)
      return res.status(404).json({ message: "Patient not found" });

    if (!["admin", "record_officer"].includes(req.user.role))
      return res.status(403).json({ message: "You do not have permission to create visits" });

    if (existingPatient.hospital.toString() !== req.user.hospital.toString())
      return res.status(403).json({ message: "Unauthorized access to patient in another hospital" });

    const { doctor, notes, ...rest } = req.body;
    const visit = await VisitModel.create({
      ...rest,
      doctor: doctor || undefined,
      notes: notes || undefined, 
      hospital: req.user.hospital,
      isDeleted: false,
    });

    res.status(201).json({ data: visit });
  } catch (err) {
    next(err);
  }
};

// ================= GET ALL VISITS =================
const getVisits = async (req, res, next) => {
  try {
    const visits = await VisitModel.find({
      hospital: req.user.hospital,
      isDeleted: false,
    })
      .populate("patient", "firstName lastName hospitalId")
      .populate("doctor", "name role")
      .sort({ visitDate: -1 });

    res.status(200).json({ data: visits });
  } catch (err) {
    next(err);
  }
};

// ================= GET VISIT BY ID =================
const getVisitById = async (req, res, next) => {
  try {
    const visit = await VisitModel.findOne({
      _id: req.params.id,
      hospital: req.user.hospital,
      isDeleted: false,
    })
      .populate("patient", "firstName lastName hospitalId")
      .populate("doctor", "name role");

    if (!visit)
      return res.status(404).json({ message: "Visit not found" });

    res.status(200).json({ data: visit });
  } catch (err) {
    next(err);
  }
};

// ================= UPDATE VISIT =================
const updateVisit = async (req, res, next) => {
  try {
    const visit = await VisitModel.findOneAndUpdate(
      { _id: req.params.id, hospital: req.user.hospital, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );

    if (!visit)
      return res.status(404).json({ message: "Visit not found" });

    res.status(200).json({ data: visit });
  } catch (err) {
    next(err);
  }
};

// ================= DELETE VISIT (soft delete) =================
const deleteVisit = async (req, res, next) => {
  try {
    const visit = await VisitModel.findOneAndUpdate(
      { _id: req.params.id, hospital: req.user.hospital, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!visit)
      return res.status(404).json({ message: "Visit not found or already deleted" });

    res.status(200).json({ message: "Visit soft-deleted successfully", data: visit });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createVisit,
  getVisits,
  getVisitById,
  updateVisit,
  deleteVisit,
};