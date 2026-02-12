const mongoose = require("mongoose");

const bedSchema = new mongoose.Schema({
  ward: String,
  bedNumber: String,
  isOccupied: { type: Boolean, default: false },
});

module.exports = mongoose.model("Bed", bedSchema);