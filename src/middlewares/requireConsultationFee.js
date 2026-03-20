const Billing = require("../models/Billing");
const Ledger = require("../models/LedgerTransaction");
const Patient = require("../models/Patient"); 

const CONSULT_FEE = 20;

const requireConsultationFee = async (req, res, next) => {
  try {
    const { patient, type } = req.body;

    console.log("REQ BODY:", req.body);
    console.log("PATIENT:", patient);
    console.log("ROUTE:", req.method, req.originalUrl);

    if (!patient) {
      return res.status(400).json({
        message: "Patient is required",
      });
    }

    if (type !== "outpatient") return next();

    const patientDoc = await Patient.findOne({
      _id: patient,
      hospital: req.user.hospital,
    });

    if (!patientDoc) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const today = new Date();

    const hasValidInsurance =
      patientDoc.insurance?.isActive &&
      patientDoc.insurance?.expiryDate > today;

    if (hasValidInsurance) return next();

    let account = await Billing.findOne({
      patient,
      hospital: req.user.hospital,
    });

    if (!account) {
      account = await Billing.create({
        patient,
        hospital: req.user.hospital,
      });
    }

    // idempotency (your logic stays intact)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const existingCharge = await Ledger.findOne({
      patient,
      hospital: req.user.hospital,
      type: "charge",
      description: "Outpatient Consultation Fee",
      createdAt: { $gte: startOfDay },
    });

    if (existingCharge) return next();

    await Ledger.create({
      hospital: req.user.hospital,
      account: account._id,
      patient,
      type: "charge",
      description: "Outpatient Consultation Fee",
      amount: CONSULT_FEE,
      createdBy: req.user?._id,
      meta: { source: "consultation_auto_charge" },
    });

    account.balance += CONSULT_FEE;
    await account.save();

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = requireConsultationFee;