const mongoose = require("mongoose");

const triageSchema = new mongoose.Schema(
  {
    visit: { type: mongoose.Schema.Types.ObjectId, ref: "Visit", required: true },

    temperature: Number,
    bloodPressure: String,
    pulse: Number,
    weight: Number,

    complaint: String,

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    triagedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Triage", triageSchema);