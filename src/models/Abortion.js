const mongoose = require("mongoose");

const abortionSchema = new mongoose.Schema(
  {
    pregnancy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pregnancy",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
    },

    type: {
      type: String,
      enum: ["spontaneous", "induced"],
      required: true,
    },

    gestationalAgeWeeks: {
      type: Number,
      min: 0,
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

module.exports = mongoose.model("Abortion", abortionSchema);