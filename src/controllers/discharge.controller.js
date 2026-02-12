const DischargeModel = require("../models/Discharge");
const AdmissionModel = require("../models/Admission");
const BedModel = require("../models/Bed");

const dischargePatient = async (req, res, next) => {
  try {
    const admission = await AdmissionModel.findById(req.body.admission);

    admission.status = "discharged";
    await admission.save();

    const bed = await BedModel.findById(admission.bed);
    bed.isOccupied = false;
    await bed.save();

    const discharge = await DischargeModel.create({
      ...req.body,
      dischargedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Patient discharged",
      data: discharge,
    });
  } catch (err) {
    next(err);
  }
};

const getDischarges = async (req, res, next) => {
  try {
    const discharges = await DischargeModel.find()
      .populate({
        path: "admission",
        populate: "patient bed",
      });

    res.status(200).json({
      success: true,
      message:"Discharged patients",
       data: discharges });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  dischargePatient,
  getDischarges,
};