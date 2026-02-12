const MedicalRecordModel = require("../models/MedicalRecord");

const createMedicalRecord = async (req, res) => {
  const record = await MedicalRecordModel.create({
    ...req.body,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Medical record created",
    data: record,
  });
};

const getMedicalRecords = async (req, res) => {
  const records = await MedicalRecordModel.find({ isDeleted: false })
    .populate("visit createdBy");

  res.json({
    success: true,
    message:"Medical records",
    data: records,
  });
};

const getMedicalRecordById = async (req, res) => {
  const record = await MedicalRecordModel.findOne({
    _id: req.params.id,
    isDeleted: false,
  });

  res.json({
    success: true,
    message:"Medical record",
    data: record,
  });
};

const updateMedicalRecord = async (req, res) => {
  delete req.body.isDeleted;

  const record = await MedicalRecordModel.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    req.body,
    { new: true }
  );

  res.json({
    success: true,
    message: "Updated",
    data: record,
  });
};

const deleteMedicalRecord = async (req, res) => {
  await MedicalRecordModel.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
  });

  res.json({
    success: true,
    message: "Deleted",
  });
};

module.exports = {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
};