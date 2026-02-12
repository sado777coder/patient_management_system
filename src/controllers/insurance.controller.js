const InsuranceClaim = require("../models/InsuranceClaim");
const Billing = require("../models/Billing"); 
const Ledger = require("../models/LedgerTransaction");
const Invoice = require("../models/Invoice");
const Patient = require("../models/Patient");


/**
 * Submit insurance claim
 * POST /insurance/claim/:invoiceId
 */
const submitClaim = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Invoice.findById(invoiceId).populate("patient");

    if (!invoice)
      return res.status(404).json({ message: "Invoice not found" });

    const account = await Billing.findOne({
      patient: invoice.patient._id,
    });

    const claim = await InsuranceClaim.create({
      patient: invoice.patient._id,
      account: account._id,
      invoice: invoice._id,
      insurer: req.body.insurer,
      claimAmount: invoice.totalAmount,
      status: "submitted",
      submittedAt: new Date(),
    });

    res.json({
      success: true,
      message: "Claim submitted to insurer",
      data: claim,
    });
  } catch (err) {
    next(err);
  }
};



/**
 * Approve claim (insurer pays hospital)
 * POST /insurance/claim/:claimId/approve
 */
const approveClaim = async (req, res, next) => {
  try {
    const { claimId } = req.params;
    const { approvedAmount } = req.body;

    const claim = await InsuranceClaim.findById(claimId);

    if (!claim)
      return res.status(404).json({ message: "Claim not found" });

    claim.status = "approved";
    claim.approvedAmount = approvedAmount;
    claim.approvedAt = new Date();

    await claim.save();

    // ledger credit (money coming in)
    await Ledger.create({
      account: claim.account,
      patient: claim.patient,
      type: "payment",
      amount: -approvedAmount,
      description: "Insurance payment",
      reference: claim._id.toString(),
      createdBy: req.user._id,
    });

    // update wallet
    const account = await Billing.findById(claim.account);
    account.balance -= approvedAmount;
    await account.save();

    res.json({
      success: true,
      message: "Claim approved & wallet credited",
    });
  } catch (err) {
    next(err);
  }
};



/**
 * Get patient insurance info (cached)
 * GET /insurance/:id/insurance
 */
const getInsurance = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .select("insurance")
      .lean();

    if (!patient)
      return res.status(404).json({ message: "Patient not found" });

    res.json(patient.insurance || {});
  } catch (err) {
    next(err);
  }
};


module.exports = {
  submitClaim,
  approveClaim,
  getInsurance, 
};