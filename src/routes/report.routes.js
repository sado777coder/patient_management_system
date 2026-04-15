const express = require("express");
const router = express.Router();

const allow = require("../middlewares/rbac");
const permission = require("../middlewares/permissions");
const requireAuth = require("../middlewares/requireAuth");

const {
  exportPatientsCSV,
  exportDiagnosisCSV,
  exportDispenseCSV,
  exportPrescriptionsCSV,
  exportLabsCSV,
  exportMedicalRecordsCSV,
  exportAntenatalCSV,
  exportAbortionsCSV,
  exportDeliveriesCSV,
  exportPostnatalCSV,
  exportReferralsCSV,
} = require("../controllers/report.controller");

// Protect all routes
router.use(requireAuth);

// ---------------- GENERAL REPORTS ----------------
router.get(
  "/patients/csv",
  allow(permission.REGISTER_PATIENT, permission.MANAGE_USERS),
  exportPatientsCSV
);

router.get(
  "/diagnoses/csv",
  allow(permission.PRESCRIBE, permission.MANAGE_USERS),
  exportDiagnosisCSV
);

router.get(
  "/dispense/csv",
  allow(permission.DISPENSE, permission.MANAGE_USERS),
  exportDispenseCSV
);

router.get(
  "/prescriptions/csv",
  allow(permission.PRESCRIBE, permission.MANAGE_USERS),
  exportPrescriptionsCSV
);

router.get(
  "/labs/csv",
  allow(permission.LAB_RESULT, permission.MANAGE_USERS),
  exportLabsCSV
);

router.get(
  "/medical-records/csv",
  allow(permission.DISPENSE, permission.MANAGE_USERS),
  exportMedicalRecordsCSV
);

// ---------------- MATERNITY REPORTS ----------------
router.get(
  "/antenatal/csv",
  allow(permission.MATERNITY, permission.MANAGE_USERS),
  exportAntenatalCSV
);

router.get(
  "/abortions/csv",
  allow(permission.MATERNITY, permission.MANAGE_USERS),
  exportAbortionsCSV
);

router.get(
  "/deliveries/csv",
  allow(permission.MATERNITY, permission.MANAGE_USERS),
  exportDeliveriesCSV
);

router.get(
  "/postnatal/csv",
  allow(permission.MATERNITY, permission.MANAGE_USERS),
  exportPostnatalCSV
);

router.get(
  "/referrals/csv",
  allow(permission.MATERNITY, permission.MANAGE_USERS),
  exportReferralsCSV
);

module.exports = router;