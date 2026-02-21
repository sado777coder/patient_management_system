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
router.use(allowRoles(permissions.REGISTER_PATIENT, 
permissions.MANAGE_USERS
));

router.get("/patients/csv", exportPatientsCSV);
router.get("/dispense/csv", exportDispenseCSV);
router.get("/prescriptions/csv", exportPrescriptionsCSV);
router.get("/labs/csv", exportLabsCSV);
router.get("/records/csv", exportMedicalRecordsCSV);

module.exports = router;