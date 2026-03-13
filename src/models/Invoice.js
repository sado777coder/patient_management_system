const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    hospital: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Hospital",
  required: true,
},
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LedgerTransaction",
      },
    ],

    invoiceNumber: {
      type: String,
      unique: true,
    },

    totalAmount: Number,

    status: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
  },
  { timestamps: true }
);

invoiceSchema.index(
  { hospital: 1, patient: 1 },
  { unique: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);