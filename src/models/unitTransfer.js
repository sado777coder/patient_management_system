const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    hospitalId: {
  type: String,
  required: true,
  index: true
},
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
    reason: String,
    transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);