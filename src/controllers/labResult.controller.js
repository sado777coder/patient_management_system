const LabResultModel = require("../models/LabResult");
const BillingModel = require("../models/Billing");


const createLabResult = async (req, res, next) => {
  try {
    const { patient, testName, amount} = req.body;

    //amount must come from lab staff
    if (!amount) {
      return res.status(400).json({
        message: "Charge amount is required",
      });
    }

    //create bill FIRST
    await BillingModel.create({
       ...req.body,
  hospital: req.user.hospital,
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
    const result = await LabResultModel.create({...req.body,
      hospital: req.user.hospital,});

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
    const results = await LabResultModel.find({ hospital: req.user.hospital,})
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
    const result = await LabResultModel.findOne({
      _id: req.params.id,
      hospital: req.user.hospital,
    }).populate("visit");

    if (!result)
      return res.status(404).json({ message: "Lab result not found" });

    res.status(200).json({
      success: true,
      message: "Result",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE
 */
const updateLabResult = async (req, res, next) => {
  try {
    const result = await LabResultModel.findOneAndUpdate(
      {
        _id: req.params.id,
        hospital: req.user.hospital,
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Lab result not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lab result updated",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE (admin only)
 */
const deleteLabResult = async (req, res, next) => {
  try {
    const result = await LabResultModel.findOneAndDelete({
      _id: req.params.id,
      hospital: req.user.hospital,
    });

    if (!result)
      return res.status(404).json({ message: "Lab result not found" });

    res.status(200).json({
      success: true,
      message: "Deleted",
    });
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