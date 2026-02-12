const mongoose = require("mongoose");

const insuranceClaimSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Billing",
      required: true,
    },

    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    },

    insurer: {
      name: String,
      policyNumber: String,
      coveragePercent: Number, // 80%, 100%, etc
    },

    claimAmount: {
      type: Number,
      required: true,
    },

    approvedAmount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "approved",
        "partial",
        "rejected",
        "paid",
      ],
      default: "draft",
      index: true,
    },

    reference: {
      type: String, // insurer claim number
    },

    submittedAt: Date,
    approvedAt: Date,
    paidAt: Date,

    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("InsuranceClaim", insuranceClaimSchema);