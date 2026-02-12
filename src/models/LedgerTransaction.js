// models/LedgerTransaction.js

const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Billing",
      required: true,
      index: true,
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["charge", "payment", "refund"],
      required: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    reference: {
      type: String, // invoice or receipt number
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    meta: {
      type: Object, // extra info (labId, visitId, etc.)
    },
  },
  { timestamps: true }
);

ledgerSchema.index({ createdAt: -1 });

module.exports = mongoose.model("LedgerTransaction", ledgerSchema);