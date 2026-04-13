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

// CREATE
router.post(
  "/",
  allowRoles(permissions.REGISTER_PATIENT),
  createUnit
);

// GET ALL
router.get("/", getUnits);

// UPDATE
router.put(
  "/:id",
  allowRoles(permissions.REGISTER_PATIENT),
  updateUnit
);

// TOGGLE STATUS
router.patch(
  "/:id/status",
  allowRoles(permissions.REGISTER_PATIENT),
  toggleUnitStatus
);

// DELETE (SOFT)
router.delete(
  "/:id",
  allowRoles(permissions.REGISTER_PATIENT),
  deleteUnit
);

module.exports = router;