const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
    reason: String,
    transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);