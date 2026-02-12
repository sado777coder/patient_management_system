const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    visit: { type: mongoose.Schema.Types.ObjectId, ref: "Visit" },

    bed: { type: mongoose.Schema.Types.ObjectId, ref: "Bed" },

    admittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    status: {
      type: String,
      enum: ["admitted", "discharged"],
      default: "admitted",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admission", admissionSchema);