const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
    index: true, // speeds up queries by hospital
  },
  name: { type: String, required: true },
  form: {
    type: String,
    enum: ["tablet", "capsule", "syrup", "injection", "cream", "ointment", "drop"],
  },
  strength: String, // e.g., "500mg"
  category: String,
});

module.exports = mongoose.model("Medication", medicationSchema);