const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema(
  {
    visit: { type: mongoose.Schema.Types.ObjectId, ref: "Visit", required: true },

    diagnosis: String,
    symptoms: [String],
    treatmentPlan: String,
    notes: String,

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  
  { timestamps: true }
);

medicalRecordSchema.index({ visit: 1 });
medicalRecordSchema.index({ isDeleted: 1, createdAt: -1 });
medicalRecordSchema.index({ createdBy: 1 });

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);