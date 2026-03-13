const mongoose = require("mongoose");

const medicationStockSchema = new mongoose.Schema(
  {
    hospital: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Hospital",
  required: true,
  index: true
},
    medication: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Medication",
  required: true,
  index: true,
},
    batchNumber: { type: String, required: true },

    quantity: { type: Number, required: true, default: 0 },
    unitPrice: { type: Number, required: true },

    expiryDate: Date,

    supplier: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicationStock", medicationStockSchema);