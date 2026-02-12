const mongoose = require("mongoose");

const dischargeSchema = new mongoose.Schema(
  {
    admission: { type: mongoose.Schema.Types.ObjectId, ref: "Admission" },

    summary: String,
    dischargedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Discharge", dischargeSchema);