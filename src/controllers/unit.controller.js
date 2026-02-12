const Unit = require("../models/Unit");

const createUnit = async (req, res, next) => {
  try {
    const unit = await Unit.create(req.body);
    res.status(201).json({
        success:true,
        message:"Unit",
         data: unit });
  } catch (err) {
    next(err);
  }
};

const getUnits = async (req, res, next) => {
  try {
    const units = await Unit.find({ isActive: true });
    res.status(200).json({
        success:true,
        message:"Available units",
         data: units });
  } catch (err) {
    next(err);
  }
};

const updateUnit = async (req, res, next) => {
  try {
    const unit = await Unit.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );

    if (!unit)
      return res.status(404).json({ message: "Unit not found" });

    res.status(200).json({
      success: true,
      message: "Unit updated",
      data: unit,
    });
  } catch (err) {
    next(err);
  }
};

const toggleUnitStatus = async (req, res, next) => {
  try {
    const unit = await Unit.findById(req.params.id);

    if (!unit)
      return res.status(404).json({ message: "Unit not found" });

    unit.isActive = !unit.isActive;
    await unit.save();

    res.status(200).json({
      success: true,
      message: `Unit ${unit.isActive ? "activated" : "deactivated"}`,
      data: unit,
    });
  } catch (err) {
    next(err);
  }
};

const deleteUnit = async (req, res, next) => {
  try {
    await Unit.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
      isActive: false,
    });

    res.status(200).json({
      success: true,
      message: "Unit archived",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createUnit,
  getUnits,
  updateUnit,
  toggleUnitStatus,
  deleteUnit, };