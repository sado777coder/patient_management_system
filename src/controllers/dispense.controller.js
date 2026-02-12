const DispenseModel = require("../models/Dispense");
const BillingModel = require("../models/Billing");

const createDispense = async (req, res, next) => {
  try {
    const { patient, items } = req.body;

    let total = 0;

    // calculate total manually
    const processedItems = items.map((item) => {
      const amount = item.price * item.quantity;
      total += amount;

      return {
        name: item.name, // medication name
        quantity: item.quantity,
        price: amount, // final line price
      };
    });

    // create dispense record
    const dispense = await DispenseModel.create({
      patient,
      items: processedItems,
      totalAmount: total,
      dispensedBy: req.user._id,
    });

    // create bill (charge only)
    await BillingModel.create({
      patient,
      items: [
        {
          description: "Medication Dispense",
          amount: total,
        },
      ],
      totalAmount: total,
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
      .populate("patient dispensedBy");

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