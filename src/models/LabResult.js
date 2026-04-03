const mongoose = require("mongoose");

const labResultSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
      index: true,
    },

    // ✅ NEW LINK (SAFE)
    labOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabOrder",
      index: true,
    },

    visit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visit",
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    testName: {
      type: String,
      required: true,
      index: true,
    },

    result: String,
    normalRange: String,

    amount: {
      type: Number,
      required: true, // stored in pesewas
    },

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

labResultSchema.index(
  { labOrder: 1, testName: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("LabResult", labResultSchema);