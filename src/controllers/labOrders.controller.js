const LabOrder = require("../models/LabOrder");
const Diagnosis = require("../models/Diagnosis");

// CREATE LAB ORDER
const createLabOrder = async (req, res, next) => {
  try {
    const { diagnosis, requestedBy, tests } = req.body;

    const diagnosisRecord = await Diagnosis.findById(diagnosis);

    if (!diagnosisRecord) {
      return res.status(404).json({
        success: false,
        message: "Diagnosis not found",
      });
    }

    const labOrder = await LabOrder.create({
      diagnosis,
      requestedBy,
      tests,
    });

    res.status(201).json({
      success: true,
      message: "Lab order created successfully",
      data: labOrder,
    });
  } catch (error) {
    next ( error );
  }
};

// GET LAB ORDER BY ID
const getLabOrder = async (req, res, next) => {
  try {
    const labOrder = await LabOrder.findById(req.params.id)
      .populate("diagnosis")
      .populate("requestedBy", "name email");
    if (!labOrder) return res.status(404).json({ message: "Lab order not found" });

    res.json({ success: true, data: labOrder });
  } catch (error) {
    next(error);
  }
};

// GET ALL LAB ORDERS FOR A DIAGNOSIS
const getDiagnosisLabOrders = async (req, res, next) => {
  try {
    const labOrders = await LabOrder.find({ diagnosis: req.params.diagnosisId })
      .populate("requestedBy", "name email");
    res.json({ success: true, data: labOrders });
  } catch (error) {
    next(error);
  }
};

// UPDATE LAB ORDER (status/results)
const updateLabOrder = async (req, res, next) => {
  try {
    const labOrder = await LabOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!labOrder) return res.status(404).json({ message: "Lab order not found" });
    res.json({ success: true, message: "Lab order updated", data: labOrder });
  } catch (error) {
    next(error);
  }
};

module.exports = {
    createLabOrder,
    getLabOrder,
    getDiagnosisLabOrders,
    updateLabOrder
}