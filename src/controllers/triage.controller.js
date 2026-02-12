const TriageModel = require("../models/Triage");

/**
 * CREATE TRIAGE
 */
const createTriage = async (req, res, next) => {
  try {
    const triage = await TriageModel.create({
      ...req.body,
      triagedBy: req.user._id,
    });

    res.status(201).json({
      success:true,
      message: "Recorded",
      data: triage,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * GET TRIAGES
 */
const getTriages = async (req, res, next) => {
  try {
    const triages = await TriageModel.find()
      .populate("visit triagedBy", "name role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success:true,
      message:"Available records",
       data: triages });
  } catch (err) {
    next(err);
  }
};


/**
 * UPDATE TRIAGE
 */
const updateTriage = async (req, res, next) => {
  try {
    const triage = await TriageModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      success:true,
      message:"Your updates",
       data: triage });
  } catch (err) {
    next(err);
  }
};


/**
 * DELETE TRIAGE (admin)
 */
const deleteTriage = async (req, res, next) => {
  try {
    await TriageModel.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success:true,
       message: "Deleted" });
  } catch (err) {
    next(err);
  }
};


module.exports = {
  createTriage,
  getTriages,
  updateTriage,
  deleteTriage,
}