const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const validate = require("../middlewares/validate");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");

const {
    createMedication,
    getAllMedications,
    getMedicationById,
    updateMedication,
    deleteMedication
} = require("../controllers/medicationStock.controller");

const {
  createMedicationStockValidator,
  updateMedicationStockValidator,
} = require("../validators/medicationStock.validator");

// Require authentication for all medication routes
router.use(requireAuth);

// Create a new medication
router.post(
  "/",
  allowRoles(permissions.DISPENSE),
  validate(createMedicationStockValidator),
  createMedication
);

// Get all medications
router.get("/", getAllMedications);

// Get a single medication by ID
router.get("/:id", getMedicationById);

// Update a medication
router.put(
  "/:id",
  allowRoles(permissions.DISPENSE),
  validate(updateMedicationStockValidator),
  updateMedication
);

// Delete a medication
router.delete(
  "/:id",
  allowRoles(permissions.DISPENSE),
  deleteMedication
);

module.exports = router;