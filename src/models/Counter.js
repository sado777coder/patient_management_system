const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  seq: {
    type: Number,
    default: 0
  }
});

// unique per hospital + name
counterSchema.index({ hospital: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Counter", counterSchema);