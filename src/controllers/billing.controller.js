const mongoose = require("mongoose");
const Billing = require("../models/Billing");
const Ledger = require("../models/LedgerTransaction");
const Invoice = require("../models/Invoice");

 //CREATE CHARGE
const createCharge = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { patient, amount, description } = req.body;

    await session.withTransaction(async () => {
      let account = await Billing.findOne({ patient }).session(session);

      if (!account) {
        account = await Billing.create([{ patient }], { session });
        account = account[0];
      }

      if (account.isFrozen) {
        throw new Error("Account is frozen");
      }

      await Ledger.create(
        [{
          account: account._id,
          patient,
          type: "charge",
          amount,
          description,
          createdBy: req.user._id,
        }],
        { session }
      );

      account.balance += amount;
      await account.save({ session });
    });

    res.json({ success: true, message: "Charge added" });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};


//PAY BILL
 
const payBill = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { patient, amount } = req.body;

    await session.withTransaction(async () => {
      const account = await Billing.findOne({ patient }).session(session);

      if (!account) throw new Error("Account not found");
      if (account.isFrozen) throw new Error("Account is frozen");

      // check BEFORE subtract
      if (amount > account.balance) {
        throw new Error("Payment exceeds outstanding balance");
      }

      await Ledger.create(
        [{
          account: account._id,
          patient,
          type: "payment",
          amount: -amount,
          description: "Payment received",
          createdBy: req.user._id,
        }],
        { session }
      );

      account.balance -= amount;
      await account.save({ session });
    });

    res.json({ success: true, message: "Payment successful" });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};


// REFUND (ADMIN ONLY)
 
const refund = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { patient, amount, description = "Refund issued" } = req.body;

    await session.withTransaction(async () => {
      const account = await Billing.findOne({ patient }).session(session);

      if (!account) throw new Error("Account not found");
      if (account.isFrozen) throw new Error("Account is frozen");

      await Ledger.create(
        [{
          account: account._id,
          patient,
          type: "refund",
          amount,
          description,
          createdBy: req.user._id,
        }],
        { session }
      );

      account.balance += amount;
      await account.save({ session });
    });

    res.json({ success: true, message: "Refund successful" });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};


//PAYMENT HISTORY
const getPaymentHistory = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // cap at 100
    const skip = (page - 1) * limit;

    const { type } = req.query;

    const account = await Billing.findOne({ patient: patientId });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const filter = { account: account._id };

    if (type) filter.type = type;

    const [history, total] = await Promise.all([
      Ledger.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Ledger.countDocuments(filter),
    ]);

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

      data: history,
    });
  } catch (error) {
    next(error);
  }
};


//GENERATE INVOICE
const generateInvoice = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const account = await Billing.findOne({ patient: patientId });

    if (!account)
      return res.status(404).json({ message: "Account not found" });

    const charges = await Ledger.find({
      account: account._id,
      type: "charge",
    });

    if (!charges.length)
      return res.status(400).json({ message: "No charges found" });

    // Calculate total
    const total = charges.reduce((sum, t) => sum + t.amount, 0);

    // Create invoice
    const invoice = await Invoice.create({
      patient: patientId,
      transactions: charges.map((c) => c._id),
      invoiceNumber: `INV-${Date.now()}`,
      totalAmount: total,
      status: "unpaid",
    });

    res.status(201).json({
      success: true,
      message: "Invoice generated successfully",
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCharge,
  payBill,
  refund,
  getPaymentHistory,
  generateInvoice,
};