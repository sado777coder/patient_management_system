const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    doctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    description: String,

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

//  Allow same unit name/code in different hospitals
unitSchema.index({ hospital: 1, code: 1 }, { unique: true });
unitSchema.index({ hospital: 1, name: 1 });

module.exports = mongoose.model("Unit", unitSchema);