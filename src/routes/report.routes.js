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

  //  PREVIEWS (ADDED)
  previewPatients,
  previewDiagnosis,
  previewDispense,
  previewPrescriptions,
  previewLabs,
  previewMedicalRecords,
  previewAntenatal,
  previewAbortions,
  previewDeliveries,
  previewPostnatal,
  previewReferrals,
} = require("../controllers/report.controller");

// Protect all routes
router.use(requireAuth);

// ======================================================
// ===================== CSV EXPORTS ====================
// ======================================================

// GENERAL REPORTS
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

// ======================================================
// ===================== MATERNITY ======================
// ======================================================

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

// ======================================================
// ===================== PREVIEWS =======================
// ======================================================

// GENERAL PREVIEWS
router.get(
  "/patients/preview",
  allow(permission.REGISTER_PATIENT, permission.MANAGE_USERS),
  previewPatients
);

router.get(
  "/diagnoses/preview",
  allow(permission.PRESCRIBE, permission.MANAGE_USERS),
  previewDiagnosis
);

router.get(
  "/dispense/preview",
  allow(permission.DISPENSE, permission.MANAGE_USERS),
  previewDispense
);

router.get(
  "/prescriptions/preview",
  allow(permission.PRESCRIBE, permission.MANAGE_USERS),
  previewPrescriptions
);

router.get(
  "/labs/preview",
  allow(permission.LAB_RESULT, permission.MANAGE_USERS),
  previewLabs
);

router.get(
  "/medical-records/preview",
  allow(permission.DISPENSE, permission.MANAGE_USERS),
  previewMedicalRecords
);

// MATERNITY PREVIEWS
router.get(
  "/antenatal/preview",
  allow(permission.MATERNITY, permission.MANAGE_USERS),
  previewAntenatal
);

router.get(
  "/abortions/preview",
  allow(permission.MATERNITY, permission.MANAGE_USERS),
  previewAbortions
);

router.get(
  "/deliveries/preview",
  allow(permission.MATERNITY, permission.MANAGE_USERS),
  previewDeliveries
);

router.get(
  "/postnatal/preview",
  allow(permission.MATERNITY, permission.MANAGE_USERS),
  previewPostnatal
);

router.get(
  "/referrals/preview",
  allow(permission.MATERNITY, permission.MANAGE_USERS),
  previewReferrals
);

module.exports = router;