const router = require("express").Router();
const requireAuth = require("../middlewares/requireAuth");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");

const {
  getBedOccupancyAnalytics,
} = require("../controllers/analytics.controller");

router.use(requireAuth);

router.get(
  "/bed-occupancy",
  allowRoles(permissions.VIEW_ALL_RECORDS),
  getBedOccupancyAnalytics
);

module.exports = router;