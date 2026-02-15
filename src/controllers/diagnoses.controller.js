const Diagnosis = require("../models/Diagnosis");
const Triage = require("../models/Triage");

// CREATE DIAGNOSIS
const createDiagnosis = async (req, res, next) => {
  try {
    const triageExists = await Triage.findOne({ visit });

if (!triageExists) {
  return res.status(400).json({
    success: false,
    message: "Patient vitals must be completed before diagnosis",
  });
}
    const diagnosis = await Diagnosis.create(req.body);
    res.status(201).json({
      success: true,
      message: "Diagnosis created",
      data: diagnosis,
    });
  } catch (error) {
    next(error);
  }
};

// GET DIAGNOSIS BY ID
const getDiagnosis = async (req, res, next) => {
  try {
    const diagnosis = await Diagnosis.findById(req.params.id)
      .populate("visit")
      .populate("diagnosedBy", "name email");
    if (!diagnosis) return res.status(404).json({ message: "Diagnosis not found" });

    res.json({ success: true, data: diagnosis });
  } catch (error) {
    next(error);
  }
};

// GET ALL DIAGNOSES FOR A VISIT
const getVisitDiagnoses = async (req, res, next) => {
  try {
    const diagnoses = await Diagnosis.find({ visit: req.params.visitId })
      .populate("diagnosedBy", "name email");
    res.json({ success: true, data: diagnoses });
  } catch (error) {
    next(error);
  }
};

// UPDATE DIAGNOSIS
const updateDiagnosis = async (req, res, next) => {
  try {
    const diagnosis = await Diagnosis.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!diagnosis) return res.status(404).json({ message: "Diagnosis not found" });
    res.json({ success: true, message: "Diagnosis updated", data: diagnosis });
  } catch (error) {
    next(error);
  }
};

module.exports = {
    createDiagnosis,
    getDiagnosis,
    getVisitDiagnoses,
    updateDiagnosis
}