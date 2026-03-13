const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");
const validate = require("../middlewares/validate");

const {
  createMedication,
  getMedications,
  getMedication,
  updateMedication,
  deleteMedication,
} = require("../controllers/medication.controller");

const {
  createMedicationValidator,
  updateMedicationValidator,
} = require("../validators/medication.validator");

// All routes require authentication
router.use(requireAuth);

/**
 * CREATE medication → only PHARMACY_ROLE
 */
router.post(
  "/",
  allowRoles(permissions.DISPENSE),
  validate(createMedicationValidator),
  createMedication
);

/**
 * GET ALL medications with optional pagination & search
 * Query params:
 *  - page (default 1)
 *  - limit (default 20)
 *  - search (optional, matches medication name)
 */
router.get("/", getMedications);

/**
 * GET SINGLE medication
 */
router.get("/:id", getMedication);

/**
 * UPDATE medication → only PHARMACY_ROLE
 */
router.patch(
  "/:id",
  allowRoles(permissions.DISPENSE),
  validate(updateMedicationValidator),
  updateMedication
);

/**
 * DELETE medication → only PHARMACY_ROLE
 */
router.delete(
  "/:id",
  allowRoles(permissions.DISPENSE),
  deleteMedication
);

module.exports = router;