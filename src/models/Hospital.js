const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true, required: true, index: true}, // e.g. GH-ACC-001
  address: String,
  phone: String,
  email: String,
}, { timestamps: true });

module.exports = mongoose.model("Hospital", hospitalSchema);