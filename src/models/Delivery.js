const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    pregnancy: { type: mongoose.Schema.Types.ObjectId, ref: "Pregnancy" },

    deliveryDate: Date,

    type: {
      type: String,
      enum: ["normal", "cesarean"],
    },

    babyWeight: Number,
    babyGender: String,

    complications: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Delivery", deliverySchema);