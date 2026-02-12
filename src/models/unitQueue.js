// models/UnitQueue.js
const mongoose = require("mongoose");

const unitQueueSchema = new mongoose.Schema(
  {
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
      index: true,
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    status: {
      type: String,
      enum: ["waiting", "in-progress", "done", "cancelled"],
      default: "waiting",
      index: true,
    },

    priority: {
      type: Number,
      default: 0, // triage level (0 normal, 1 urgent, 2 critical)
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UnitQueue", unitQueueSchema)