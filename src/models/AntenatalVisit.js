const mongoose = require("mongoose");

const antenatalVisitSchema = new mongoose.Schema(
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

    visitDate: {
      type: Date,
      required: true,
    },

    gestationalAgeWeeks: {
      type: Number,
      min: 0,
    },

    bloodPressure: {
      type: String,
    },

    weight: {
      type: Number,
    },

    fetalHeartRate: {
      type: Number,
    },

    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AntenatalVisit", antenatalVisitSchema);