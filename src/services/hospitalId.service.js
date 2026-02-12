const Counter = require("../models/Counter");

/**
 * Generates: GH-2026-000123
 */
const generateHospitalId = async () => {
  const year = new Date().getFullYear();

  // atomic increment
  const counter = await Counter.findOneAndUpdate(
    { name: `patient-${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const padded = String(counter.seq).padStart(6, "0");

  return `GH-${year}-${padded}`;
};

module.exports = generateHospitalId