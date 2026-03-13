const mongoose = require("mongoose");

const bedSchema = new mongoose.Schema({
  hospital: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Hospital",
  required: true,
  index: true
},
  ward: String,
  bedNumber: String,
  isOccupied: { type: Boolean, default: false },
});

module.exports = mongoose.model("Bed", bedSchema);