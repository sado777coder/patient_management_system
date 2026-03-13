const Counter = require("../models/Counter");

/**
 * Generates hospital-specific ID: GH-2026-000123
 * @param {ObjectId} hospitalId
 */
const generateHospitalId = async (hospitalId) => {
  const year = new Date().getFullYear();

  // atomic increment, hospital-specific
  const counter = await Counter.findOneAndUpdate(
    { hospital: hospitalId, name: `patient-${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const padded = String(counter.seq).padStart(6, "0");

  return `GH-${year}-${padded}`;
};

module.exports = generateHospitalId;