const mongoose = require("mongoose");

const labOrderSchema = new mongoose.Schema(
  {
    hospital: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Hospital",
  required: true,
  index: true
},
    diagnosis: { type: mongoose.Schema.Types.ObjectId, ref: "Diagnosis", required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tests: [{ type: String, required: true }], // e.g., "CBC", "X-ray Chest"
    notes : {type:String,},
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    results: [{ test: String, result: String, normalRange: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("LabOrder", labOrderSchema);