const PrescriptionModel = require("../models/Prescription");
const Diagnosis = require("../models/Diagnosis");

const createPrescription = async (req, res, next) => {
  try {
    const { visit, diagnosis, prescribedBy, medications } = req.body;

    const diagnosisRecord = await Diagnosis.findById(diagnosis);

    if (!diagnosisRecord) {
      return res.status(404).json({
        success: false,
        message: "Diagnosis not found",
      });
    }

    // Ensure diagnosis matches visit
    if (diagnosisRecord.visit.toString() !== visit) {
      return res.status(400).json({
        success: false,
        message: "Diagnosis does not belong to this visit",
      });
    }

    const prescription = await Prescription.create({
      visit,
      diagnosis,
      prescribedBy,
      medications,
    });

    res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      data: prescription,
    });
  } catch (error) {
    next(
      error
    );
  }
};

const getPrescriptions = async (req, res, next) => {
 try {
   const prescriptions = await PrescriptionModel.find({ isDeleted: false })
    .populate("visit prescribedBy");

  res.json({
    success: true,
    data: prescriptions,
  });
 } catch (error) {
  next (error);
 }
};

const updatePrescription = async (req, res, next) => {
  try {
    delete req.body.isDeleted;

  const prescription = await PrescriptionModel.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    req.body,
    { new: true }
  );

  res.json({
    success: true,
    message: "Updated",
    data: prescription,
  });
  } catch (error) {
    next (error);
  }
};

const deletePrescription = async (req, res, next) => {
 try {
   await PrescriptionModel.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
  });

  res.json({
    success: true,
    message: "Deleted",
  });
 } catch (error) {
  next (error);
 }
};

module.exports = {
  createPrescription,
  getPrescriptions,
  updatePrescription,
  deletePrescription,
};