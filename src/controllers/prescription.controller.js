const PrescriptionModel = require("../models/Prescription");
const Diagnosis = require("../models/Diagnosis");

const createPrescription = async (req, res, next) => {
  try {
    const { visit, diagnosis, medications } = req.body;

    const diagnosisRecord = await Diagnosis.findOne({
      _id: diagnosis,
      hospital: req.user.hospital,
    });

    if (!diagnosisRecord) {
      return res.status(404).json({
        success: false,
        message: "Diagnosis not found",
      });
    }

    if (diagnosisRecord.visit.toString() !== visit) {
      return res.status(400).json({
        success: false,
        message: "Diagnosis does not belong to this visit",
      });
    }

    const prescription = await PrescriptionModel.create({
      hospital: req.user.hospital,
      visit,
      diagnosis,
      medications,
      prescribedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};

const getPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await PrescriptionModel.find({
      hospital: req.user.hospital,
      isDeleted: false,
    })
      .populate("visit")
      .populate("prescribedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: prescriptions,
    });
  } catch (error) {
    next(error);
  }
};

const updatePrescription = async (req, res, next) => {
  try {
    // Protect immutable fields
    delete req.body.hospital;
    delete req.body.visit;
    delete req.body.diagnosis;
    delete req.body.prescribedBy;
    delete req.body.isDeleted;
    delete req.body.deletedAt;

    const prescription = await PrescriptionModel.findOneAndUpdate(
      {
        _id: req.params.id,
        hospital: req.user.hospital,
        isDeleted: false,
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!prescription)
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });

    res.json({
      success: true,
      message: "Updated",
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};

const deletePrescription = async (req, res, next) => {
  try {
    const prescription = await PrescriptionModel.findOneAndUpdate(
      {
        _id: req.params.id,
        hospital: req.user.hospital,
        isDeleted: false,
      },
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!prescription)
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });

    res.json({
      success: true,
      message: "Deleted",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPrescription,
  getPrescriptions,
  updatePrescription,
  deletePrescription,
};