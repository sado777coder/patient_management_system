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
  "/dispense/csv",
  allowRoles(permissions.DISPENSE, permissions.MANAGE_USERS),
  exportDispenseCSV
);

router.get(
  "/prescriptions/csv",
  allowRoles(permissions.PRESCRIBE, permissions.MANAGE_USERS),
  exportPrescriptionsCSV
);

router.get(
  "/labs/csv",
  allowRoles(permissions.LAB_RESULT, permissions.MANAGE_USERS),
  exportLabsCSV
);

router.get(
  "/records/csv",
  allowRoles(permissions.VIEW_ALL_RECORDS, permissions.MANAGE_USERS),
  exportMedicalRecordsCSV
);

module.exports = router;