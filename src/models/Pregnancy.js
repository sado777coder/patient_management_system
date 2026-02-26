const mongoose = require("mongoose");

const pregnancySchema = new mongoose.Schema(
  {
    hospitalId: {
    type: String,
    required: true,
    index: true,
  },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true, // helps queries
    },

    gravida: {
      type: Number,
      required: true,
      min: 0,
    },

    para: {
      type: Number,
      required: true,
      min: 0,
    },

    lastMenstrualPeriod: {
      type: Date,
    },

    expectedDeliveryDate: {
      type: Date,
    },

    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    status: {
      type: String,
      enum: ["ongoing", "delivered", "terminated", "referred"],
      default: "ongoing",
    },

    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pregnancy", pregnancySchema);