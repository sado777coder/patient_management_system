const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    pregnancy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pregnancy",
      required: true,
      index: true, // optional, helps queries
    },

    deliveryDate: {
      type: Date,
      required: true,
    },

    type: {
      type: String,
      enum: ["normal", "cesarean"],
      required: true,
    },

    babyWeight: {
      type: Number,
      min: 0,
    },

    babyGender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    complications: {
      type: String,
    },
  },
  { timestamps: true }
);

// Enforce one delivery per pregnancy
deliverySchema.index({ pregnancy: 1 }, { unique: true });

module.exports = mongoose.model("Delivery", deliverySchema);