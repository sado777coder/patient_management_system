const BedModel = require("../models/Bed");

const createBed = async (req, res, next) => {
  try {
    const bed = await BedModel.create(req.body);

    res.status(201).json({
      success: true,
      message:"Bed created",
       data: bed });
  } catch (err) {
    next(err);
  }
};

const getBeds = async (req, res, next) => {
  try {
    const beds = await BedModel.find();

    res.status(200).json({
      success: true,
       data: beds });
  } catch (err) {
    next(err);
  }
};

const updateBed = async (req, res, next) => {
  try {
    const bed = await BedModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message:"Bed updated",
       data: bed });
  } catch (err) {
    next(err);
  }
};

const deleteBed = async (req, res, next) => {
  try {
    await BedModel.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
       message: "Deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBed,
  getBeds,
  updateBed,
  deleteBed,
};