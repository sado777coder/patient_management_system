const LabResultModel = require("../models/LabResult");
const BillingModel = require("../models/Billing");


const createLabResult = async (req, res, next) => {
  try {
    const { patient, testName, amount } = req.body;

    //amount must come from lab staff
    if (!amount) {
      return res.status(400).json({
        message: "Charge amount is required",
      });
    }

    //create bill FIRST
    await BillingModel.create({
      patient,
      items: [
        {
          description: `Lab Test - ${testName}`,
          amount,
        },
      ],
      paymentStatus: "pending",
    });

    //then create result
    const result = await LabResultModel.create(req.body);

    res.status(201).json({
      success: true,
      message: "Lab charge added. Await payment before service.",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ALL
 */
const getLabResults = async (req, res, next) => {
  try {
    const results = await LabResultModel.find()
      .populate({
        path: "visit",
        populate: ["patient", "doctor"],
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success:true,
      message:"Results",
       data: results });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ONE
 */
const getLabResultById = async (req, res, next) => {
  try {
    const result = await LabResultModel.findById(req.params.id)
      .populate("visit");

    if (!result)
      return res.status(404).json({ message: "Lab result not found" });

    res.status(200).json({
      success:true,
      message:"Result",
       data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE
 */
const updateLabResult = async (req, res, next) => {
  try {
    const result = await LabResultModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({ 
      success:true,
      message:"Updated result",
      data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE (admin only)
 */
const deleteLabResult = async (req, res, next) => {
  try {
    await LabResultModel.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      success:true,
      message: "Deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createLabResult,
  getLabResults,
  getLabResultById,
  updateLabResult,
  deleteLabResult,
};