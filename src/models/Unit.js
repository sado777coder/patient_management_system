const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    code: {
      type: String, // OPD, ENT, MAT, etc
      required: true,
      unique: true,
      uppercase: true,
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
}
  },
  { timestamps: true }
);

module.exports = mongoose.model("Unit", unitSchema);