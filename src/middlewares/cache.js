const redis = require("../config/redis");

const cache = (keyBuilder, ttl = 300) => {
  return async (req, res, next) => {
    try {
      const key = keyBuilder(req);

      const cached = await redis.get(key);

      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // patch res.json
      const originalJson = res.json.bind(res);

      res.json = async (data) => {
        await redis.set(key, JSON.stringify(data), "EX", ttl);
        return originalJson(data);
      };

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = cache;