const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");
const validate = require("../middlewares/validate");

const {
  admitPatient,
  getAdmissions,
  getAdmissionById,
} = require("../controllers/admission.controller");

const { createAdmissionValidator } = require("../validators/admission.validator");

router.use(requireAuth);

// ------------------ ADMIT PATIENT ------------------
router.post(
  "/",
  allowRoles(permissions.TRIAGE, permissions.PRESCRIBE),
  validate(createAdmissionValidator),
  admitPatient
);

// ------------------ GET ADMISSIONS (PAGINATED) ------------------
router.get("/", getAdmissions);

// ------------------ GET SINGLE ADMISSION ------------------
router.get("/:id", getAdmissionById);

module.exports = router;