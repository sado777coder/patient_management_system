const BedModel = require("../models/Bed");

const createBed = async (req, res, next) => {
  try {
    const bed = await BedModel.create({
      ...req.body,
      hospital: req.user.hospital,
    });

    res.status(201).json({
      success: true,
      message: "Bed created",
      data: bed,
    });
  } catch (err) {
    next(err);
  }
};

const getBeds = async (req, res, next) => {
  try {
    const beds = await BedModel.find({
      hospital: req.user.hospital,
    });

    res.status(200).json({
      success: true,
      data: beds,
    });
  } catch (err) {
    next(err);
  }
};

const updateBed = async (req, res, next) => {
  try {
    const bed = await BedModel.findOneAndUpdate(
      {
        _id: req.params.id,
        hospital: req.user.hospital, // ensures hospital isolation
      },
      req.body,
      { new: true }
    );

    if (!bed) {
      return res.status(404).json({
        success: false,
        message: "Bed not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bed updated",
      data: bed,
    });
  } catch (err) {
    next(err);
  }
};

const deleteBed = async (req, res, next) => {
  try {
    const bed = await BedModel.findOneAndDelete({
      _id: req.params.id,
      hospital: req.user.hospital, // secure filter
    });

    if (!bed) {
      return res.status(404).json({
        success: false,
        message: "Bed not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Deleted",
    });
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