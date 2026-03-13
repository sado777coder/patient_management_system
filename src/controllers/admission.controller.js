const mongoose = require("mongoose");
const AdmissionModel = require("../models/Admission");
const BedModel = require("../models/Bed");

/**
 * ADMIT PATIENT
 */
const admitPatient = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const hospital = req.user.hospital;

    const bed = await BedModel.findOne(
      { _id: req.body.bed, hospital },
      null,
      { session }
    );

    if (!bed || bed.isOccupied) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Bed unavailable" });
    }

    bed.isOccupied = true;
    await bed.save({ session });

    const admission = await AdmissionModel.create(
      [{
        ...req.body,
        hospital,
        admittedBy: req.user._id,
      }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Patient admitted",
      data: admission[0],
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

/**
 * GET ADMISSIONS WITH PAGINATION
 */
const getAdmissions = async (req, res, next) => {
  try {
    const hospital = req.user.hospital;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [total, admissions] = await Promise.all([
      AdmissionModel.countDocuments({ hospital }),
      AdmissionModel.find({ hospital })
        .populate("patient visit bed admittedBy")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      data: admissions,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET SINGLE ADMISSION
 */
const getAdmissionById = async (req, res, next) => {
  try {
    const hospital = req.user.hospital;
    const { id } = req.params;

    const admission = await AdmissionModel.findOne({
      _id: id,
      hospital, // enforce hospital-level isolation
    }).populate("patient visit bed admittedBy");

    if (!admission) {
      return res.status(404).json({ success: false, message: "Admission not found" });
    }

    res.status(200).json({
      success: true,
      data: admission,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  admitPatient,
  getAdmissions,
  getAdmissionById,
};