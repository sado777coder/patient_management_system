const mongoose = require("mongoose");

const pregnancySchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },

    lastMenstrualPeriod: Date,
    expectedDeliveryDate: Date,

    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pregnancy", pregnancySchema);