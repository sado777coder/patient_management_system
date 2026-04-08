const mongoose = require("mongoose");
const Billing = require("../models/Billing");
const Ledger = require("../models/LedgerTransaction");
const Invoice = require("../models/Invoice");
const Admission = require("../models/Admission");
const Patient = require("../models/Patient"); 

// CREATE CHARGE
const createCharge = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    let { patient, visit, amount, description } = req.body;

    if (!amount || amount <= 0)
      return res.status(400).json({ success: false, message: "Invalid charge amount" });

    const amountInPesewas = Math.round(amount * 100);

    await session.withTransaction(async () => {
      let account = await Billing.findOne({ patient, hospital: req.user.hospital }).session(session);

      if (!account) {
        const created = await Billing.create(
          [{ patient, hospital: req.user.hospital, balance: 0 }],
          { session }
        );
        account = created[0];
      }

      if (account.isFrozen) throw new Error("Account is frozen");

      await Ledger.create(
        [{
          hospital: req.user.hospital,
          account: account._id,
          patient,
          visit,
          type: "charge",
          amount: amountInPesewas,
          description,
          createdBy: req.user._id,
        }],
        { session }
      );

      account.balance += amountInPesewas;
      await account.save({ session });
    });

    res.status(201).json({ success: true, message: "Charge added successfully" });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};

// PAY BILL
const payBill = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    let { patient, visit, amount } = req.body;

    if (!amount || amount <= 0)
      return res.status(400).json({ success: false, message: "Invalid payment amount" });

    const amountInPesewas = Math.round(amount * 100);

    await session.withTransaction(async () => {
      const account = await Billing.findOne({ patient, hospital: req.user.hospital }).session(session);

      if (!account) throw new Error("Account not found");
      if (account.isFrozen) throw new Error("Account is frozen");
      if (amountInPesewas > account.balance)
        throw new Error("Payment exceeds outstanding balance");

      await Ledger.create(
        [{
          hospital: req.user.hospital,
          account: account._id,
          patient,
          visit,
          type: "payment",
          amount: -amountInPesewas,
          description: "Payment received",
          createdBy: req.user._id,
        }],
        { session }
      );

      account.balance -= amountInPesewas;
      await account.save({ session });
    });

    res.json({ success: true, message: "Payment successful" });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};

// REFUND (ADMIN ONLY)
const refund = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "Admin only" });

    let { patient, visit, amount, description = "Refund issued" } = req.body;

    if (!amount || amount <= 0)
      return res.status(400).json({ success: false, message: "Invalid refund amount" });

    const amountInPesewas = Math.round(amount * 100);

    await session.withTransaction(async () => {
      const account = await Billing.findOne({ patient, hospital: req.user.hospital }).session(session);

      if (!account) throw new Error("Account not found");
      if (account.isFrozen) throw new Error("Account is frozen");

      await Ledger.create(
        [{
          hospital: req.user.hospital,
          account: account._id,
          patient,
          visit,
          type: "refund",
          amount: amountInPesewas,
          description,
          createdBy: req.user._id,
        }],
        { session }
      );

      account.balance += amountInPesewas;
      await account.save({ session });
    });

    res.json({ success: true, message: "Refund successful" });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};

// PAYMENT HISTORY 
const getPaymentHistory = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { visitId, type, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    //  SEARCH BY NAME / REG NUMBER / ID
    let patientQuery = { _id: patientId };

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      const patient = await Patient.findOne({
        hospital: req.user.hospital,
        $or: [
          { registrationNumber: { $regex: patientId, $options: "i" } },
          { firstName: { $regex: patientId, $options: "i" } },
          { lastName: { $regex: patientId, $options: "i" } },
        ],
      });

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      patientQuery = { _id: patient._id };
    }

    const account = await Billing.findOne({
      patient: patientQuery._id,
      hospital: req.user.hospital,
    });

    if (!account) return res.status(404).json({ message: "Account not found" });

    const filter = { account: account._id };
    if (type) filter.type = type;
    if (visitId) filter.visit = visitId;

    const [history, total] = await Promise.all([
      Ledger.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Ledger.countDocuments(filter),
    ]);

    const formattedHistory = history.map((tx) => ({
      ...tx.toObject(),
      amount: tx.amount / 100,
    }));

    res.json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      data: formattedHistory,
      balance: account.balance / 100,
    });
  } catch (error) {
    next(error);
  }
};

// GENERATE INVOICE
const generateInvoice = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { visitId } = req.query;

    const account = await Billing.findOne({ patient: patientId, hospital: req.user.hospital });
    if (!account) return res.status(404).json({ message: "Account not found" });

    const filter = { account: account._id, type: "charge" };
    if (visitId) filter.visit = visitId;

    const charges = await Ledger.find(filter);
    if (!charges.length)
      return res.status(400).json({ message: "No charges found" });

    const total = charges.reduce((sum, t) => sum + t.amount, 0);

    const invoice = await Invoice.create({
      hospital: req.user.hospital,
      patient: patientId,
      visit: visitId || null,
      transactions: charges.map((c) => c._id),
      invoiceNumber: `INV-${Date.now()}`,
      totalAmount: total,
      status: "unpaid",
    });

    res.status(201).json({
      success: true,
      message: "Invoice generated successfully",
      data: {
        ...invoice.toObject(),
        totalAmount: invoice.totalAmount / 100,
      },
    });
  } catch (error) {
    next(error);
  }
};

// CHECK UNPAID BILLS
const checkAdmissionBills = async (req, res, next) => {
  try {
    const { admissionId } = req.params;

    const admission = await Admission.findOne({
      _id: admissionId,
      hospital: req.user.hospital,
    });

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: "Admission not found",
      });
    }

    const account = await Billing.findOne({
      hospital: req.user.hospital,
      patient: admission.patient,
    });

    const unpaid = account ? account.balance / 100 : 0;

    res.status(200).json({
      success: true,
      unpaid,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCharge,
  payBill,
  refund,
  getPaymentHistory,
  generateInvoice,
  checkAdmissionBills,
};