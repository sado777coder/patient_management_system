const Billing = require("../models/Billing"); // account
const Ledger = require("../models/LedgerTransaction");
const Patient = require("../models/Patient");

const CONSULT_FEE = 20;

const requireConsultationFee = async (req, res, next) => {
  try {
    const { patient, type } = req.body;

    if (type !== "outpatient") return next();

    const patientDoc = await Patient.findById(patient);

    if (!patientDoc) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const today = new Date();

    const hasValidInsurance =
      patientDoc.insurance?.isActive &&
      patientDoc.insurance?.expiryDate > today;

    if (hasValidInsurance) return next();

    // get or create wallet account
    let account = await Billing.findOne({ patient });

    if (!account) {
      account = await Billing.create({ patient });
    }

    // create immutable charge entry
    await Ledger.create({
      account: account._id,
      patient,
      type: "charge",
      description: "Outpatient Consultation Fee",
      amount: CONSULT_FEE,
      createdBy: req.user?._id,
      meta: {
        source: "consultation_auto_charge",
      },
    });

    // update balance
    account.balance += CONSULT_FEE;
    await account.save();

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = requireConsultationFee;