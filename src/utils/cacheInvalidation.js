const redis = require("../config/redis");

const invalidatePatient = async (patientId) => {
  await redis.del(`patient:${patientId}`);
};

module.exports = { invalidatePatient };