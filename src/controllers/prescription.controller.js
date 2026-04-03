const PrescriptionModel = require("../models/Prescription");
const Diagnosis = require("../models/Diagnosis");
const mongoose = require("mongoose");

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
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const search = req.query.q?.trim();

    let filter = {
      hospital: req.user.hospital,
      isDeleted: false,
    };

    const [prescriptions, total] = await Promise.all([
      PrescriptionModel.find(filter)
        .populate({
          path: "visit",
          populate: {
            path: "patient",
            select: "firstName lastName",
          },
        })
        .populate("prescribedBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      PrescriptionModel.countDocuments(filter),
    ]);

    const formatted = prescriptions.map((p) => ({
      ...p,
      prescribedBy: p.prescribedBy
        ? {
            ...p.prescribedBy,
            name: `${p.prescribedBy.firstName} ${p.prescribedBy.lastName}`,
          }
        : null,
    }));

    res.json({
      success: true,
      data: formatted,
      meta: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
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

/**
 * SEARCH PRESCRIPTIONS
 */
const searchPrescriptions = async (req, res, next) => {
  try {
    const keyword = req.query.q?.trim();

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Search query required",
      });
    }

    const matchConditions = [
      { "patient.firstName": { $regex: keyword, $options: "i" } },
      { "patient.lastName": { $regex: keyword, $options: "i" } },
      { "patient.registrationNumber": { $regex: keyword, $options: "i" } },
      { "medications.name": { $regex: keyword, $options: "i" } },
    ];

    if (mongoose.Types.ObjectId.isValid(keyword)) {
      matchConditions.push({ _id: new mongoose.Types.ObjectId(keyword) });
      matchConditions.push({ "visit._id": new mongoose.Types.ObjectId(keyword) });
    }

    const results = await PrescriptionModel.aggregate([
      { $match: { hospital: req.user.hospital, isDeleted: false } },

      {
        $lookup: {
          from: "visits",
          localField: "visit",
          foreignField: "_id",
          as: "visit",
        },
      },
      { $unwind: "$visit" },

      {
        $lookup: {
          from: "patients",
          localField: "visit.patient",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: "$patient" },

      {
        $lookup: {
          from: "users",
          localField: "prescribedBy",
          foreignField: "_id",
          as: "prescribedBy",
        },
      },
      { $unwind: { path: "$prescribedBy", preserveNullAndEmptyArrays: true } },

      { $match: { $or: matchConditions } },

      {
        $project: {
          medications: 1,
          createdAt: 1,
          prescribedBy: {
            _id: "$prescribedBy._id",
            name: {
              $concat: ["$prescribedBy.firstName", " ", "$prescribedBy.lastName"],
            },
          },
          visit: {
            _id: "$visit._id",
            patient: {
              _id: "$patient._id",
              firstName: "$patient.firstName",
              lastName: "$patient.lastName",
            },
          },
        },
      },
    ]);

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
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
  searchPrescriptions,
  deletePrescription,
};