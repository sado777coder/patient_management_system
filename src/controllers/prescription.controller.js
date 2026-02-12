const PrescriptionModel = require("../models/Prescription");

const createPrescription = async (req, res) => {
  const prescription = await PrescriptionModel.create({
    ...req.body,
    prescribedBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Prescription created",
    data: prescription,
  });
};

const getPrescriptions = async (req, res) => {
  const prescriptions = await PrescriptionModel.find({ isDeleted: false })
    .populate("visit prescribedBy");

  res.json({
    success: true,
    data: prescriptions,
  });
};

const updatePrescription = async (req, res) => {
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
};

const deletePrescription = async (req, res) => {
  await PrescriptionModel.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
  });

  res.json({
    success: true,
    message: "Deleted",
  });
};

module.exports = {
  createPrescription,
  getPrescriptions,
  updatePrescription,
  deletePrescription,
};