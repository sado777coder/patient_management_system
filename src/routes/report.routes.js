const express = require("express");
const router = express.Router();
const requireAuth = require("../middlewares/requireAuth");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");

// CSV Controller
const {
  exportPatientsCSV,
  exportDispenseCSV,
  exportPrescriptionsCSV,
  exportLabsCSV,
  exportMedicalRecordsCSV,
} = require("../controllers/report.controller");

// Generic async handler to forward errors to Express
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// 🔹 Require authentication for all routes
router.use(requireAuth);

// --- Patients CSV ---
router.get(
  "/patients/csv",
  allowRoles(permissions.REGISTER_PATIENT, permissions.MANAGE_USERS),
  asyncHandler(exportPatientsCSV)
);

// --- Dispense CSV ---
router.get(
  "/dispense/csv",
  allowRoles(permissions.DISPENSE, permissions.MANAGE_USERS),
  asyncHandler(exportDispenseCSV)
);

// --- Prescriptions CSV ---
router.get(
  "/prescriptions/csv",
  allowRoles(permissions.PRESCRIBE, permissions.MANAGE_USERS),
  asyncHandler(exportPrescriptionsCSV)
);

// --- Labs CSV ---
router.get(
  "/labs/csv",
  allowRoles(permissions.LAB_RESULT, permissions.MANAGE_USERS),
  asyncHandler(exportLabsCSV)
);

// --- Medical Records CSV ---
router.get(
  "/medical-records/csv",
  allowRoles(permissions.VIEW_ALL_RECORDS),
  asyncHandler(exportMedicalRecordsCSV)
);

module.exports = router;