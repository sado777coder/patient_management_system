const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const validate = require("../middlewares/validate");
const permissions = require("../middlewares/permissions");
const allowRoles = require("../middlewares/rbac");

const {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
} = require("../controllers/medicalRecord.controller");

const {
  createMedicalRecordValidator,
  updateMedicalRecordValidator,
} = require("../validators/medicalRecord.validator");

router.use(requireAuth);

/**
 * doctor/nurse create
 */
router.post(
  "/",
  allowRoles(permissions.REGISTER_PATIENT),
  validate(createMedicalRecordValidator),
  createMedicalRecord
);

router.get("/",allowRoles(permissions.VIEW_ALL_RECORDS), getMedicalRecords);

router.get("/:id", getMedicalRecordById);

router.put(
  "/:id",
  allowRoles(permissions.REGISTER_PATIENT),
  validate(updateMedicalRecordValidator),
  updateMedicalRecord
);

router.delete("/:id", allowRoles(permissions.REGISTER_PATIENT), deleteMedicalRecord);

module.exports = router;