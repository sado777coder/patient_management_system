const mongoose = require("mongoose");
const PatientModel = require("../models/Patient");
const redis = require("../config/redis");
const { invalidatePatient } = require("../utils/cacheInvalidation");

// CREATE PATIENT
const createPatient = async (req, res, next) => {
  try {
    if (!req.user.hospital) {
      return res.status(400).json({
        success: false,
        message: "User not linked to hospital",
      });
    }

    const patient = await PatientModel.create({
      ...req.body,
      hospital: req.user.hospital,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: patient,
    });
  } catch (err) {
    next(err);
  }
};

// GET ALL PATIENTS
const getPatients = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const filter = {
      hospital: req.user.hospital,
      isDeleted: false,
    };

    let patients = await PatientModel.find(filter)
      .populate("unit", "name code")
      .populate("createdBy", "firstName lastName email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    patients = patients.map((p) => ({
      ...p,
      createdBy: p.createdBy
        ? {
            ...p.createdBy,
            name: `${p.createdBy.firstName || ""} ${p.createdBy.lastName || ""}`.trim(),
          }
        : null,
    }));

    const total = await PatientModel.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: patients,
      meta: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET BY ID
const getPatientById = async (req, res, next) => {
  try {
    const patient = await PatientModel.findOne({
      _id: req.params.id,
      hospital: req.user.hospital,
      isDeleted: false,
    })
      .populate("unit", "name code")
      .populate("createdBy", "firstName lastName email role")
      .lean();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // ADD NAME FIELD
    patient.createdBy = patient.createdBy
      ? {
          ...patient.createdBy,
          name: `${patient.createdBy.firstName || ""} ${patient.createdBy.lastName || ""}`.trim(),
        }
      : null;

    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE
const updatePatient = async (req, res, next) => {
  try {
    const patient = await PatientModel.findOneAndUpdate(
      {
        _id: req.params.id,
        hospital: req.user.hospital,
        isDeleted: false,
      },
      { ...req.body, updatedBy: req.user._id },
      { new: true }
    )
      .populate("createdBy", "firstName lastName email role")
      .lean();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE
const deletePatient = async (req, res, next) => {
  try {
    const patient = await PatientModel.findOne({
      _id: req.params.id,
      hospital: req.user.hospital,
      isDeleted: false,
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    await patient.softDelete(req.user._id);

    res.json({
      success: true,
      message: "Archived",
    });
  } catch (err) {
    next(err);
  }
};

// SEARCH
const searchPatients = async (req, res, next) => {
  try {
    const keyword = req.query.q?.trim();
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Search required",
      });
    }

    let patients = await PatientModel.find({
      hospital: req.user.hospital,
      isDeleted: false,
      $or: [
        { firstName: { $regex: keyword, $options: "i" } },
        { lastName: { $regex: keyword, $options: "i" } },
        { phone: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
      ],
    })
      .populate("createdBy", "firstName lastName email role")
      .lean();

    patients = patients.map((p) => ({
      ...p,
      createdBy: p.createdBy
        ? {
            ...p.createdBy,
            name: `${p.createdBy.firstName || ""} ${p.createdBy.lastName || ""}`.trim(),
          }
        : null,
    }));

    res.json({
      success: true,
      data: patients,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  searchPatients,
};