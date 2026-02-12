const BillingModel = require("../models/Billing");

/**
 * Blocks service if patient has unpaid bills
 */
const checkOutstandingBills = async (req, res, next) => {
  try {
    const patient = req.body.patient || req.params.patientId;

    const unpaid = await BillingModel.findOne({
      patient,
      paymentStatus: "pending",
      isDeleted: false,
    });

    if (unpaid) {
      return res.status(403).json({
        message:
          "Outstanding bills exist. Please pay at Revenue before receiving service.",
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = checkOutstandingBills;