const mongoose = require("mongoose");
const PatientModel = require("../models/Patient");
const redis = require("../config/redis");
const { invalidatePatient } = require("../utils/cacheInvalidation");


 // CREATE PATIENT

const createPatient = async (req, res, next) => {
  try {
    // Ensure the user is associated with a hospital
    if (!req.user.hospital) {
      return res.status(400).json({
        success: false,
        message: "Cannot create patient: user is not associated with a hospital",
      });
    }

    const hospital = req.user.hospital;

    // Attempt to create patient
    const patient = await PatientModel.create({
      ...req.body,
      hospital,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: patient,
    });

  } catch (err) {
  console.log("Mongo error:", err);

  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyPattern || {});
    console.log("Duplicate fields:", duplicateField);

    return res.status(400).json({
      success: false,
      message: `Duplicate detected`,
      fields: duplicateField
    });
  }

  next(err);
}
};

/**
 * GET ALL PATIENTS (PAGINATED)
 */
const getPatients = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const filter = {
      hospital: req.user.hospital,
      isDeleted: false
    };

    const [patients, total] = await Promise.all([
      PatientModel.find(filter)
        .populate("unit", "name code")
        .populate("createdBy", "name role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      PatientModel.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      message: "Patients fetched successfully",
      data: patients,
      meta: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET SINGLE PATIENT (with Redis caching)
 */
const getPatientById = async (req, res, next) => {
  try {
    const cacheKey = `patient:${req.user.hospital}:${req.params.id}`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        source: "cache",
        data: JSON.parse(cached)
      });
    }

    // Query database
    const patient = await PatientModel.findOne({
      _id: req.params.id,
      hospital: req.user.hospital,
      isDeleted: false
    }).populate("unit", "name code").lean();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    // Store in cache for 60 seconds
    await redis.set(cacheKey, JSON.stringify(patient), "EX", 60);

    res.status(200).json({
      success: true,
      source: "database",
      data: patient
    });

  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE PATIENT
 */
const updatePatient = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID"
      });
    }

    // Protect sensitive fields
    const blockedFields = [
      "hospital",
      "registrationNumber",
      "isDeleted",
      "deletedAt",
      "deletedBy"
    ];
    blockedFields.forEach(field => delete req.body[field]);

    const patient = await PatientModel.findOneAndUpdate(
      {
        _id: req.params.id,
        hospital: req.user.hospital,
        isDeleted: false
      },
      {
        ...req.body,
        updatedBy: req.user._id
      },
      {
        new: true,
        runValidators: true
      }
    ).populate("unit", "name code").lean();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    // Invalidate cache after update
    await invalidatePatient(`${req.user.hospital}:${patient._id}`);

    res.status(200).json({
      success: true,
      message: "Patient updated successfully",
      data: patient
    });

  } catch (err) {
    next(err);
  }
};

/**
 * SOFT DELETE PATIENT
 */
const deletePatient = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID"
      });
    }

    const patient = await PatientModel.findOne({
      _id: req.params.id,
      hospital: req.user.hospital,
      isDeleted: false
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    await patient.softDelete(req.user._id);

    // Invalidate cache after deletion
    await invalidatePatient(`${req.user.hospital}:${patient._id}`);

    res.status(200).json({
      success: true,
      message: "Patient archived successfully"
    });

  } catch (err) {
    next(err);
  }
};

/**
 * SEARCH PATIENTS (with optional caching)
 */
const searchPatients = async (req, res, next) => {
  try {
    const keyword = req.query.q?.trim();

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Search query required"
      });
    }

    const cacheKey = `patient-search:${req.user.hospital}:${keyword}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.status(200).json({
        success: true,
        source: "cache",
        count: JSON.parse(cached).length,
        data: JSON.parse(cached)
      });
    }

    // SMART FILTER
    let filter = {
      hospital: req.user.hospital,
      isDeleted: false,
      $or: [
        { firstName: { $regex: keyword, $options: "i" } },
        { lastName: { $regex: keyword, $options: "i" } },
        { phone: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
      ]
    };

    //  OBJECT ID SEARCH
    if (mongoose.Types.ObjectId.isValid(keyword)) {
      filter.$or.push({ _id: keyword });
    }

    //  REGISTRATION NUMBER
    filter.$or.push({ registrationNumber: { $regex: keyword, $options: "i" } });

    const patients = await PatientModel.find(filter)
      .populate("unit", "name code")
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Cache result
    await redis.set(cacheKey, JSON.stringify(patients), "EX", 30);

    res.status(200).json({
      success: true,
      source: "database",
      count: patients.length,
      data: patients
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
  searchPatients
};