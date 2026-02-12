const mongoose = require("mongoose");

const medicationStockSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    batchNumber: { type: String, required: true },

    quantity: { type: Number, required: true, default: 0 },
    unitPrice: { type: Number, required: true },

    expiryDate: Date,

    supplier: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicationStock", medicationStockSchema);