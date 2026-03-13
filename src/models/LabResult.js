const mongoose = require("mongoose");

const labResultSchema = new mongoose.Schema(
  {
    hospital: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Hospital",
  required: true,
  index: true
},
    visit: { type: mongoose.Schema.Types.ObjectId, ref: "Visit" },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    testName: String,
    result: String,
    normalRange: String,
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LabResult", labResultSchema);