const MedicalRecordModel = require("../models/MedicalRecord");

const createMedicalRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecordModel.create({
      ...req.body,
      hospital: req.user.hospital,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Medical record created",
      data: record,
    });
  } catch (err) {
    next(err);
  }
};

const getMedicalRecords = async (req, res, next) => {
  try {
    const records = await MedicalRecordModel.find({
      hospital: req.user.hospital,
      isDeleted: false,
    })
      .populate("visit")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Medical records",
      data: records,
    });
  } catch (err) {
    next(err);
  }
};

const getMedicalRecordById = async (req, res, next) => {
  try {
    const record = await MedicalRecordModel.findOne({
      _id: req.params.id,
      hospital: req.user.hospital,
      isDeleted: false,
    }).populate("visit createdBy");

    if (!record)
      return res.status(404).json({
        success: false,
        message: "Medical record not found",
      });

    res.json({
      success: true,
      message: "Medical record",
      data: record,
    });
  } catch (err) {
    next(err);
  }
};

const updateMedicalRecord = async (req, res, next) => {
  try {
    // prevent forbidden fields
    delete req.body.isDeleted;
    delete req.body.hospital;
    delete req.body.visit;
    delete req.body.createdBy;

    const record = await MedicalRecordModel.findOneAndUpdate(
      {
        _id: req.params.id,
        hospital: req.user.hospital,
        isDeleted: false,
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!record)
      return res.status(404).json({
        success: false,
        message: "Medical record not found",
      });

    res.json({
      success: true,
      message: "Updated",
      data: record,
    });
  } catch (err) {
    next(err);
  }
};

const deleteMedicalRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecordModel.findOneAndUpdate(
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

    if (!record)
      return res.status(404).json({
        success: false,
        message: "Medical record not found",
      });

    res.json({
      success: true,
      message: "Deleted",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
};