const router = require("express").Router();
const requireAuth = require("../middlewares/requireAuth");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");

const {
  exportPatientsCSV,
  exportDispenseCSV,
  exportPrescriptionsCSV,
  exportLabsCSV,
  exportMedicalRecordsCSV,
} = require("../controllers/report.controller");

// All routes require authentication
router.use(requireAuth);

// --- CSV Export Routes ---

// Patients CSV
router.get(
  "/patients/csv",
  allowRoles(permissions.REGISTER_PATIENT, permissions.MANAGE_USERS),
  exportPatientsCSV
);

// Dispense CSV
router.get(
  "/dispense/csv",
  allowRoles(permissions.DISPENSE, permissions.MANAGE_USERS),
  exportDispenseCSV
);

// Prescriptions CSV
router.get(
  "/prescriptions/csv",
  allowRoles(permissions.PRESCRIBE, permissions.MANAGE_USERS),
  exportPrescriptionsCSV
);

// Labs CSV
router.get(
  "/labs/csv",
  allowRoles(permissions.LAB_RESULT, permissions.MANAGE_USERS),
  exportLabsCSV
);

// Medical Records CSV
router.get(
  "/records/csv",
  allowRoles(permissions.VIEW_ALL_RECORDS),
  exportMedicalRecordsCSV
);

module.exports = router;