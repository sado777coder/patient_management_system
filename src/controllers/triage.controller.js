const TriageModel = require("../models/Triage");

/**
 * CREATE TRIAGE
 */
const createTriage = async (req, res, next) => {
  try {
    const triage = await TriageModel.create({
       ...req.body,
        hospital: req.user.hospital,
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
    const triages = await TriageModel.find({
  hospital: req.user.hospital,
  isDeleted: false,
})
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
    const triage = await TriageModel.findOneAndUpdate(
  { _id: req.params.id, hospital: req.user.hospital , isDeleted: false,},
  req.body,
  { new: true, runValidators: true }
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
    const triage = await TriageModel.findOneAndUpdate(
      { _id: req.params.id, hospital: req.user.hospital, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!triage) {
      return res.status(404).json({
        success: false,
        message: "Triage record not found or already deleted",
      });
    }

    res.status(200).json({
      success: true,
      message: "Triage record soft-deleted successfully",
      data: triage,
    });
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