const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    visit: { type: mongoose.Schema.Types.ObjectId, ref: "Visit", required: true },
     diagnosis: { type: mongoose.Schema.Types.ObjectId, ref: "Diagnosis", required: true },

    medications: [
      {
        name: String,
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

prescriptionSchema.index({ visit: 1 });
prescriptionSchema.index({ isDeleted: 1, createdAt: -1 });
prescriptionSchema.index({ prescribedBy: 1 });

module.exports = mongoose.model("Prescription", prescriptionSchema);