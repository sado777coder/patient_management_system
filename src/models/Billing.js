const mongoose = require("mongoose");

const billingSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      unique: true,
      index: true,
    },

    // Always computed, never manually edited
    balance: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "GHS",
    },

    isFrozen: {
      type: Boolean,
      default: false, // block transactions if needed
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Billing", billingSchema);