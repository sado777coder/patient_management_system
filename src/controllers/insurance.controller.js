const mongoose = require("mongoose");
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

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      hospital: req.user.hospital,
    }).populate("patient");

    if (!invoice)
      return res.status(404).json({ message: "Invoice not found" });

    const account = await Billing.findOne({
      patient: invoice.patient._id,
      hospital: req.user.hospital,
    });

    if (!account)
      return res.status(404).json({ message: "Billing account not found" });

    const claim = await InsuranceClaim.create({
      hospital: req.user.hospital,
      patient: invoice.patient._id,
      account: account._id,
      invoice: invoice._id,
      insurer: req.body.insurer,
      claimAmount: invoice.totalAmount, // already in pesewas
      status: "submitted",
      submittedAt: new Date(),
    });

    res.json({
      success: true,
      message: "Claim submitted to insurer",
      data: {
        ...claim.toObject(),
        claimAmount: claim.claimAmount / 100,
      },
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
  const session = await mongoose.startSession();

  try {
    const { claimId } = req.params;
    const { approvedAmount } = req.body;

    const approvedInPesewas = Math.round(approvedAmount * 100);

    let updatedClaim;

    await session.withTransaction(async () => {

      const claim = await InsuranceClaim.findOne({
        _id: claimId,
        hospital: req.user.hospital,
      }).session(session);

      if (!claim)
        throw new Error("Claim not found");

      claim.status = "approved";
      claim.approvedAmount = approvedInPesewas;
      claim.approvedAt = new Date();

      await claim.save({ session });
      updatedClaim = claim;

      await Ledger.create(
        [{
          hospital: req.user.hospital,
          account: claim.account,
          patient: claim.patient,
          type: "payment",
          amount: -approvedInPesewas,
          description: "Insurance payment",
          reference: claim._id.toString(),
          createdBy: req.user._id,
        }],
        { session }
      );

      const account = await Billing.findOne({
        _id: claim.account,
        hospital: req.user.hospital,
      }).session(session);

      account.balance -= approvedInPesewas;
      await account.save({ session });
    });

    res.json({
      success: true,
      message: "Claim approved & wallet credited",
      data: {
        ...updatedClaim.toObject(),
        approvedAmount: updatedClaim.approvedAmount / 100,
      },
    });

  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};



/**
 * Get patient insurance info (cached)
 * GET /insurance/:id/insurance
 */
const getInsurance = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({
      _id: req.params.id,
      hospital: req.user.hospital,
    })
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