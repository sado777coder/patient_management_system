const DispenseModel = require("../models/Dispense");
const BillingModel = require("../models/Billing");
const MedicationStock = require("../models/MedicationStock");

/**
 * CREATE DISPENSE (With Stock Validation + Billing)
 */
const createDispense = async (req, res, next) => {
  try {
    const { patient, prescription, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Items are required" });
    }

    let totalAmount = 0;
    const processedItems = [];

    for (let item of items) {
      //  Check medication exists
      const medication = await MedicationStock.findById(item.medication);

      if (!medication) {
        return res.status(404).json({
          error: `Medication not found for ID: ${item.medication}`,
        });
      }

      // Check stock
      if (medication.quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${medication.name}`,
        });
      }

      // Reduce stock
      medication.quantity -= item.quantity;
      await medication.save();

      // Calculate total
      const amount = item.price * item.quantity;
      totalAmount += amount;

      processedItems.push({
        medication: item.medication,
        quantity: item.quantity,
        price: item.price,
      });
    }

    // Create dispense record
    const dispense = await DispenseModel.create({
      patient,
      prescription,
      items: processedItems,
      totalAmount,
      dispensedBy: req.user?._id,
    });

    // Create billing record
    await BillingModel.create({
      patient,
      items: [
        {
          description: "Medication Dispense",
          amount: totalAmount,
        },
      ],
      totalAmount,
      paymentStatus: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Medication dispensed. Bill added. Please pay at Revenue.",
      data: dispense,
    });

  } catch (err) {
    next(err);
  }
};


/**
 * GET DISPENSE HISTORY
 */
const getDispenses = async (req, res, next) => {
  try {
    const records = await DispenseModel.find()
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