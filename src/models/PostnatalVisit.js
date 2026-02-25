const mongoose = require("mongoose");

const postnatalVisitSchema = new mongoose.Schema(
  {
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

    motherCondition: {
      type: String,
    },

    bloodPressure: {
      type: String,
    },

    temperature: {
      type: Number,
    },

    complications: {
      type: String,
    },

    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PostnatalVisit", postnatalVisitSchema);