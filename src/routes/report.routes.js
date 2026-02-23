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

router.use(requireAuth);

// CSV Export Routes
router.get(
  "/patients/csv",
  allowRoles(permissions.REGISTER_PATIENT, permissions.MANAGE_USERS),
  exportPatientsCSV
);

router.get(
  "/dispense/csv",
  allowRoles(permissions.DISPENSE, permissions.MANAGE_USERS),
  exportDispenseCSV
);

router.get(
  "/prescriptions/csv",
  allowRoles(permissions.DOCTOR, permissions.MANAGE_USERS),
  exportPrescriptionsCSV
);

router.get(
  "/labs/csv",
  allowRoles(permissions.LAB, permissions.MANAGE_USERS),
  exportLabsCSV
);

router.get(
  "/records/csv",
  allowRoles(permissions.DOCTOR, permissions.MANAGE_USERS),
  exportMedicalRecordsCSV
);

module.exports = router;