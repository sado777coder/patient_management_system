const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    hospital: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Hospital",
  required: true,
},
    visit: { type: mongoose.Schema.Types.ObjectId, ref: "Visit", required: true },
     diagnosis: { type: mongoose.Schema.Types.ObjectId, ref: "Diagnosis", required: true },

    medications: [
  {
    medication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medication",
    },
    dosage: String,
    frequency: String,
    duration: String,
  },
],

    prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  
  { timestamps: true }
);

prescriptionSchema.index({hospital:1, visit: 1 });
prescriptionSchema.index({ isDeleted: 1, createdAt: -1 });
prescriptionSchema.index({ prescribedBy: 1 });

module.exports = mongoose.model("Prescription", prescriptionSchema);