const mongoose = require("mongoose");
const DispenseModel = require("../models/Dispense");
const BillingModel = require("../models/Billing");
const LedgerModel = require("../models/LedgerTransaction");
const MedicationStock = require("../models/MedicationStock");

/**
 * CREATE DISPENSE (Stock Safe + Ledger Billing + Pesewas)
 */
const createDispense = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { patient, prescription, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Items are required" });
    }

    let createdDispense;

    await session.withTransaction(async () => {
      let totalAmount = 0;
      const processedItems = [];

      for (const item of items) {
       const medication = await MedicationStock.findOne({
        _id: item.medication,
        hospital: req.user.hospital,
      })
      .populate("medication", "name")
      .session(session);

        if (!medication)
          throw new Error("Medication not found");

        if (medication.quantity < item.quantity)
          throw new Error(
            `Insufficient stock for ${medication.name}`
          );

        if (medication.expiryDate && medication.expiryDate < new Date())
          throw new Error(`${medication.name} is expired`);

        //  ALWAYS TRUST DATABASE PRICE
        const priceInPesewas = Math.round(medication.unitPrice * 100);
        const amount = priceInPesewas * item.quantity;

        totalAmount += amount;

        // Deduct stock
        medication.quantity -= item.quantity;
        await medication.save({ session });

        processedItems.push({
          medication: medication._id,
          quantity: item.quantity,
          price: priceInPesewas,
        });
      }

      const dispense = await DispenseModel.create(
        [{
          hospital: req.user.hospital,
          patient,
          prescription,
          items: processedItems,
          totalAmount,
          dispensedBy: req.user._id,
        }],
        { session }
      );

      createdDispense = dispense[0];

      let account = await BillingModel.findOne({
        patient,
        hospital: req.user.hospital,
      }).session(session);

      if (!account) {
        const created = await BillingModel.create(
          [{ patient, hospital: req.user.hospital }],
          { session }
        );
        account = created[0];
      }

      if (account.isFrozen)
        throw new Error("Account is frozen");

      await LedgerModel.create(
        [{
          hospital: req.user.hospital,
          account: account._id,
          patient,
          type: "charge",
          amount: totalAmount,
          description: "Medication Dispense",
          createdBy: req.user._id,
        }],
        { session }
      );

      account.balance += totalAmount;
      await account.save({ session });
    });

    return res.status(201).json({
      success: true,
      message: "Medication dispensed. Bill added successfully.",
      data: {
        ...createdDispense.toObject(),
        totalAmount: createdDispense.totalAmount / 100,
      },
    });

  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};


/**
 * GET DISPENSE HISTORY
 */
const getDispenses = async (req, res, next) => {
  try {
    const records = await DispenseModel.find({hospital: req.user.hospital})
      .populate("patient")
      .populate("dispensedBy")
      .populate("items.medication", "name batchNumber unitPrice");

    res.status(200).json({
      success: true,
      message: "DISPENSE HISTORY",
      data: records,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createDispense,
  getDispenses,
};