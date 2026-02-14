const LabOrder = require("../models/LabOrder");

// CREATE LAB ORDER
const createLabOrder = async (req, res, next) => {
  try {
    const labOrder = await LabOrder.create(req.body);
    res.status(201).json({ success: true, message: "Lab order created", data: labOrder });
  } catch (error) {
    next(error);
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