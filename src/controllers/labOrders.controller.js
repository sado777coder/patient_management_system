const LabOrder = require("../models/LabOrder");
const Diagnosis = require("../models/Diagnosis");
const mongoose = require("mongoose");

// CREATE LAB ORDER
const createLabOrder = async (req, res, next) => {
  try {
    const { diagnosis, tests, notes } = req.body;

    console.log("Diagnosis ID:", diagnosis);
    console.log("User hospital:", req.user.hospital);

    // Find diagnosis
    const diagnosisRecord = await Diagnosis.findById(diagnosis);
    console.log("Diagnosis Record:", diagnosisRecord);

    if (!diagnosisRecord) {
      return res.status(404).json({
        success: false,
        message: "Diagnosis not found",
      });
    }

    // Ensure diagnosis belongs to same hospital
    if (diagnosisRecord.hospital.toString() !== req.user.hospital.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized hospital access",
      });
    }

    const labOrder = await LabOrder.create({
      hospital: req.user.hospital,
      diagnosis: diagnosisRecord._id,
      requestedBy: req.user._id,
      tests,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Lab order created successfully",
      data: labOrder,
    });

  } catch (error) {
    next(error);
  }
};

// GET LAB ORDER BY ID
const getLabOrder = async (req, res, next) => {
  try {
    const labOrder = await LabOrder.findOne({
      _id: req.params.id,
      hospital: req.user.hospital,
    })
      .populate("diagnosis")
      .populate("requestedBy", "name email");

    if (!labOrder) {
      return res.status(404).json({
        success: false,
        message: "Lab order not found",
      });
    }

    res.json({
      success: true,
      data: labOrder,
    });

  } catch (error) {
    next(error);
  }
};

// GET ALL LAB ORDERS FOR A DIAGNOSIS
const getDiagnosisLabOrders = async (req, res, next) => {
  try {
    const filter = {
      diagnosis: req.params.diagnosisId,
      hospital: req.user.hospital,
    };

    const labOrders = await LabOrder.find(filter)
      .populate({
        path: "diagnosis",
        populate: {
          path: "visit",
          populate: {
            path: "patient",
            select: "firstName lastName",
          },
        },
      })
      .populate("requestedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: labOrders,
    });

  } catch (error) {
    next(error);
  }
};

// UPDATE LAB ORDER
const updateLabOrder = async (req, res, next) => {
  try {
    const { status, results, notes } = req.body;

    const labOrder = await LabOrder.findOneAndUpdate(
      {
        _id: req.params.id,
        hospital: req.user.hospital,
      },
      {
        status,
        results,
        notes,
      },
      {
        new: true,
      }
    );

    if (!labOrder) {
      return res.status(404).json({
        success: false,
        message: "Lab order not found",
      });
    }

    res.json({
      success: true,
      message: "Lab order updated",
      data: labOrder,
    });

  } catch (error) {
    next(error);
  }
};

/**
 * SEARCH LAB ORDERS
 */
const searchLabOrders = async (req, res, next) => {
  try {
    const keyword = req.query.q?.trim();

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Search query required",
      });
    }

    const matchConditions = [
      { notes: { $regex: keyword, $options: "i" } },
      { status: { $regex: keyword, $options: "i" } },
      { "patient.registrationNumber": { $regex: keyword, $options: "i" } },
    ];

    if (mongoose.Types.ObjectId.isValid(keyword)) {
      matchConditions.push({ _id: new mongoose.Types.ObjectId(keyword) });
    }

    const results = await LabOrder.aggregate([
      { $match: { hospital: req.user.hospital, isDeleted: false } },

      // FIX: join diagnosis → visit → patient
      {
        $lookup: {
          from: "diagnoses",
          localField: "diagnosis",
          foreignField: "_id",
          as: "diagnosis",
        },
      },
      { $unwind: "$diagnosis" },

      {
        $lookup: {
          from: "visits",
          localField: "diagnosis.visit",
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
          localField: "requestedBy",
          foreignField: "_id",
          as: "requestedBy",
        },
      },
      { $unwind: { path: "$requestedBy", preserveNullAndEmptyArrays: true } },

      { $match: { $or: matchConditions } },

      {
        $project: {
          tests: 1,
          status: 1,
          notes: 1,
          createdAt: 1,
          requestedBy: {
            _id: "$requestedBy._id",
            name: {
              $trim: {
                input: {
                  $concat: ["$requestedBy.firstName", " ", "$requestedBy.lastName"],
                },
              },
            },
          },
          patient: {
            _id: "$patient._id",
            firstName: "$patient.firstName",
            lastName: "$patient.lastName",
          },
        },
      },
    ]);

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createLabOrder,
  getLabOrder,
  getDiagnosisLabOrders,
  updateLabOrder,
  searchLabOrders
};