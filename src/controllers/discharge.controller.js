const mongoose = require("mongoose");
const DischargeModel = require("../models/Discharge");
const AdmissionModel = require("../models/Admission");
const BedModel = require("../models/Bed");
const BillModel = require("../models/Billing");
const logAudit = require("../models/AuditLog"); // import the helper

const dischargePatient = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { admission, summary } = req.body;

    if (!admission) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Admission ID is required",
      });
    }

    // Find admission belonging to user's hospital
    const admissionRecord = await AdmissionModel.findOne({
      _id: admission,
      hospital: req.user.hospital,
    }).session(session);

    if (!admissionRecord) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Admission not found",
      });
    }

    if (admissionRecord.status === "discharged") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Patient already discharged",
      });
    }

    // Prevent discharge if unpaid bills exist
    const unpaidBills = await BillModel.countDocuments({
      hospital: req.user.hospital,
      patient: admissionRecord.patient,
      status: "UNPAID",
    }).session(session);

    if (unpaidBills > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Outstanding bills must be paid before discharge",
      });
    }

    // Calculate Length of Stay
    const dischargedAt = new Date();

    const lengthOfStay =
      (dischargedAt - admissionRecord.createdAt) / (1000 * 60 * 60 * 24);

    const totalDays = Math.ceil(lengthOfStay);

    // Update admission
    admissionRecord.status = "discharged";
    admissionRecord.dischargedAt = dischargedAt;
    admissionRecord.lengthOfStay = totalDays;

    await admissionRecord.save({ session });

    // Free bed
    if (admissionRecord.bed) {
      await BedModel.findByIdAndUpdate(
        admissionRecord.bed,
        { isOccupied: false },
        { session }
      );
    }

    // Create discharge record
    const discharge = await DischargeModel.create(
      [
        {
          hospital: req.user.hospital,
          admission,
          patient: admissionRecord.patient,
          summary,
          dischargedBy: req.user._id,
        },
      ],
      { session }
    );

    // Create audit log
    await logAudit({
      userId: req.user._id,
      action: "DISCHARGE_PATIENT",
      entity: "Discharge",
      entityId: discharge[0]._id,
      metadata: {
        patient: admissionRecord.patient,
        admission,
        lengthOfStay: totalDays,
      },
    });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Patient discharged successfully",
      data: discharge[0],
    });

  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};


const getDischarges = async (req, res, next) => {
  try {
    const discharges = await DischargeModel.find({
      hospital: req.user.hospital,
    })
      .populate({
        path: "admission",
        populate: [
          { path: "patient" },
          { path: "bed" },
        ],
      })
      .populate("dischargedBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Discharged patients",
      count: discharges.length,
      data: discharges,
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  dischargePatient,
  getDischarges,
};