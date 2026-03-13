const mongoose = require("mongoose");

const triageSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true,},
    visit: { type: mongoose.Schema.Types.ObjectId, ref: "Visit", required: true },

    vitals: {
      temperature: { type: Number, min: 30, max: 45 },
      bloodPressure: { type: String, match: /^\d{2,3}\/\d{2,3}$/ },
      heartRate: { type: Number, min: 20, max: 250 },
      respiratoryRate: { type: Number, min: 5, max: 60 },
      pulse: { type: Number, min: 20, max: 250 },
      oxygenSaturation: { type: Number, min: 50, max: 100 },
      weight: { type: Number, min: 1, max: 500 },
      height: { type: Number, min: 30, max: 300 },
    },

    complaint: { type: String },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    triagedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

triageSchema.index({ hospital: 1, visit: 1 }, { unique: true });

module.exports = mongoose.model("Triage", triageSchema);