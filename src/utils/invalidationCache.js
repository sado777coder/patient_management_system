const redis = require("../config/redis");

const clearCSVCache = async (prefix, hospitalId) => {
  try {
    const keys = await redis.keys(`csv:${prefix}:${hospitalId}:*`);
    console.log("Clearing keys:", keys);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (err) {
    console.error("Cache clear error:", err);
  }
};

module.exports = clearCSVCache;