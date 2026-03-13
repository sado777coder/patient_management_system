const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
   hospital: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Hospital",
  required: true
},
    pregnancy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pregnancy",
      required: true,
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
deliverySchema.index({ hospital:1, pregnancy: 1 }, { unique: true });

module.exports = mongoose.model("Delivery", deliverySchema);