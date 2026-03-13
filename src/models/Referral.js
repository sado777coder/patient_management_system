const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    hospital: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Hospital",
  required: true,
  index: true
},
    pregnancy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pregnancy",
      required: true,
      index: true,
    },

    referredTo: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },

    referralDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },

    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Referral", referralSchema);