const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    visitDate: { type: Date, default: Date.now },
    type: { type: String, enum: ["outpatient", "inpatient", "emergency"] },

    notes: String,
  },

  { timestamps: true }
);
 visitSchema.index({patient : 1}),
  visitSchema.index({visitDate : 1}),

module.exports = mongoose.model("Visit", visitSchema);