const redis = require("../config/redis");

const invalidatePatient = async (patientId) => {
  const keys = await redis.keys(`*${patientId}*`);

  if (keys.length) {
    await redis.del(keys);
  }
};

module.exports = { invalidatePatient };