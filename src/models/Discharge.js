const mongoose = require("mongoose");

const dischargeSchema = new mongoose.Schema(
  {
    hospital: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Hospital",
  required: true,
  index: true
},
    admission: { type: mongoose.Schema.Types.ObjectId, ref: "Admission" },

    summary: String,
    dischargedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Discharge", dischargeSchema);