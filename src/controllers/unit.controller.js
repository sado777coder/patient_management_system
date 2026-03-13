const Unit = require("../models/Unit");

const createUnit = async (req, res, next) => {
  try {
    const unit = await Unit.create({
      ...req.body,
      hospital: req.user.hospital,
    });

    res.status(201).json({
      success: true,
      message: "Unit created",
      data: unit,
    });
  } catch (err) {
    next(err);
  }
};

const getUnits = async (req, res, next) => {
  try {
    const units = await Unit.find({
      hospital: req.user.hospital,
      isActive: true,
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      message: "Available units",
      data: units,
    });
  } catch (err) {
    next(err);
  }
};

const updateUnit = async (req, res, next) => {
  try {
    const unit = await Unit.findOneAndUpdate(
      { _id: req.params.id, hospital: req.user.hospital, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );

    if (!unit)
      return res.status(404).json({ success: false, message: "Unit not found" });

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
    const unit = await Unit.findOne({
      _id: req.params.id,
      hospital: req.user.hospital,
      isDeleted: false,
    });

    if (!unit)
      return res.status(404).json({ success: false, message: "Unit not found" });

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
    const unit = await Unit.findOneAndUpdate(
      { _id: req.params.id, hospital: req.user.hospital, isDeleted: false },
      { isDeleted: true, isActive: false },
      { new: true }
    );

    if (!unit)
      return res.status(404).json({ success: false, message: "Unit not found or already deleted" });

    res.status(200).json({
      success: true,
      message: "Unit archived successfully",
      data: unit,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createUnit,
  getUnits,
  updateUnit,
  toggleUnitStatus,
  deleteUnit,
};