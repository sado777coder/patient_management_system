const mongoose = require("mongoose");

const schema = new mongoose.Schema({
 hospital: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Hospital",
  required: true,
  index: true
},
  unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
  date: { type: String, index: true }, // "2026-02-05"
  count: { type: Number, default: 0 },
});

module.exports = mongoose.model("UnitAttendance", schema);