const express = require("express");
const router = express.Router();
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");
const {
  createDiagnosis,
  getDiagnosis,
  getVisitDiagnoses,
  updateDiagnosis,
} = require("../controllers/diagnoses.controller");
const { createDiagnosisValidator, updateDiagnosisValidator } = require("../validators/diagnosis.validator");
const validate = require("../middlewares/validate"); // middleware to run Joi validation

router.post("/", 
    allowRoles(permissions.PRESCRIBE)
    ,validate(createDiagnosisValidator), createDiagnosis);
router.get("/:id", getDiagnosis);
router.get("/visit/:visitId", getVisitDiagnoses);
router.patch("/:id",
    allowRoles(permissions.PRESCRIBE), 
    validate(updateDiagnosisValidator), updateDiagnosis);

module.exports = router;