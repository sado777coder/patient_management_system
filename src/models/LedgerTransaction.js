const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
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
    visit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visit", 
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
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    meta: {
      type: Object,
    },
  },
  { timestamps: true }
);

ledgerSchema.index({ hospital: 1 });
ledgerSchema.index({ createdAt: -1 });

module.exports = mongoose.model("LedgerTransaction", ledgerSchema);