const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");

const {
  createUnit,
  getUnits,
  updateUnit,
  toggleUnitStatus,
  deleteUnit,
} = require("../controllers/unit.controller");

router.use(requireAuth);

// create
router.post(
  "/",
  allowRoles(permissions.REGISTER_PATIENT),
  createUnit
);

// list
router.get("/", getUnits);

// update
router.put(
  "/:id",
  allowRoles(permissions.REGISTER_PATIENT),
  updateUnit
);

// activate/deactivate
router.patch(
  "/:id/status",
  allowRoles(permissions.REGISTER_PATIENT),
  toggleUnitStatus
);

// soft delete
router.delete(
  "/:id",
  allowRoles(permissions.REGISTER_PATIENT),
  deleteUnit
);

module.exports = router;