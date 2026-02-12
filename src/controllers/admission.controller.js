const AdmissionModel = require("../models/Admission");
const BedModel = require("../models/Bed");

/**
 * ADMIT PATIENT
 */
const admitPatient = async (req, res, next) => {
  try {
    const bed = await BedModel.findById(req.body.bed);

    if (!bed || bed.isOccupied) {
      return res.status(400).json({ message: "Bed unavailable" });
    }

    bed.isOccupied = true;
    await bed.save();

    const admission = await AdmissionModel.create({
      ...req.body,
      admittedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Patient admitted",
      data: admission,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * GET ADMISSIONS
 */
const getAdmissions = async (req, res, next) => {
  try {
    const admissions = await AdmissionModel.find()
      .populate("patient visit bed admittedBy");

    res.status(200).json({ 
      success: true,
      data: admissions });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  admitPatient,
  getAdmissions,
};