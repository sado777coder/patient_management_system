const mongoose = require("mongoose");

const diagnosisSchema = new mongoose.Schema(
  {
   hospital: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Hospital",
  required: true,
  index: true
},
    visit: { type: mongoose.Schema.Types.ObjectId, ref: "Visit",
       required: true,
      },
    diagnosedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    symptoms: { type: String, required: true },
    signs: { type: String },
    diagnosis: { type: String, required: true },
    investigations: [{ type: String }], // lab tests, imaging, etc.
    notes: { type: String },
  },
  { timestamps: true }
);

diagnosisSchema.index({ visit: 1, hospital: 1 }, { unique: true });

module.exports = mongoose.model("Diagnosis", diagnosisSchema);