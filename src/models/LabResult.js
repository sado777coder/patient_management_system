const mongoose = require("mongoose");

const labResultSchema = new mongoose.Schema(
  {
    visit: { type: mongoose.Schema.Types.ObjectId, ref: "Visit", required: true },

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