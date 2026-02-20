const mongoose = require("mongoose");
const DischargeModel = require("../models/Discharge");
const AdmissionModel = require("../models/Admission");
const BedModel = require("../models/Bed");
const BillModel = require("../models/Billing"); // if you have billing

const dischargePatient = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { admission, summary } = req.body;

    const admissionRecord = await AdmissionModel.findById(admission).session(session);

    if (!admissionRecord) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Admission not found" });
    }

    if (admissionRecord.status === "discharged") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Patient already discharged" });
    }

    // OPTIONAL: Prevent discharge if unpaid bills exist
    const unpaidBills = await BillModel.find({
      patient: admissionRecord.patient,
      status: "UNPAID",
    }).session(session);

    if (unpaidBills.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Outstanding bills must be paid before discharge",
      });
    }

    // Calculate Length of Stay
    const dischargedAt = new Date();
    const lengthOfStay =
      (dischargedAt - admissionRecord.createdAt) / (1000 * 60 * 60 * 24);

    // Update admission
    admissionRecord.status = "discharged";
    admissionRecord.dischargedAt = dischargedAt;
    admissionRecord.lengthOfStay = Math.ceil(lengthOfStay);
    await admissionRecord.save({ session });

    // Free bed
    await BedModel.findByIdAndUpdate(
      admissionRecord.bed,
      { isOccupied: false },
      { session }
    );

   // Create discharge record
const discharge = await DischargeModel.create(
  [
    {
      admission,
      patient: admissionRecord.patient,
      summary,
      dischargedBy: req.user._id,
    },
  ],
  { session }
);

// Create Audit Log
await AuditLogModel.create(
  [
    {
      user: req.user._id,
      action: "DISCHARGE_PATIENT",
      collection: "Discharge",
      documentId: discharge[0]._id,
      metadata: {
        patient: admissionRecord.patient,
        admission: admission,
        lengthOfStay: Math.ceil(lengthOfStay),
      },
    },
  ],
  { session }
);

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Patient discharged successfully",
      data: discharge[0],
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
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