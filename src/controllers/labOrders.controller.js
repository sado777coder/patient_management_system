const LabOrder = require("../models/LabOrder");
const Diagnosis = require("../models/Diagnosis");

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
    const labOrders = await LabOrder.find({
      diagnosis: req.params.diagnosisId,
      hospital: req.user.hospital,
    }).populate("requestedBy", "name email");

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

module.exports = {
  createLabOrder,
  getLabOrder,
  getDiagnosisLabOrders,
  updateLabOrder,
};