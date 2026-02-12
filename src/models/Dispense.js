const mongoose = require("mongoose");

const dispenseSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription" },

    items: [
      {
        medication: { type: mongoose.Schema.Types.ObjectId, ref: "MedicationStock" },
        quantity: Number,
        price: Number,
      },
    ],

    totalAmount: Number,

    dispensedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dispense", dispenseSchema);