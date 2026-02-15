const mongoose = require("mongoose");

const triageSchema = new mongoose.Schema(
  {
    visit: { type: mongoose.Schema.Types.ObjectId, ref: "Visit", 
      required: true,
       unique: true},

    // Vitals
    vitals: {
      temperature: { type: Number },             // °C
      bloodPressure: { type: String },           // "120/80" format
      heartRate: { type: Number },               // bpm
      respiratoryRate: { type: Number },         // breaths per min
      oxygenSaturation: { type: Number },       // SpO2 %
      weight: { type: Number },                  // kg
      height: { type: Number },                  // cm
    },

    // Optional complaints or notes
    complaint: { type: String },

    // Triage priority
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    // Reference to the user (nurse/triage officer) who performed triage
    triagedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Triage", triageSchema);