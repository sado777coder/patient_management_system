const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");
const validate = require("../middlewares/validate");

const {
  admitPatient,
  getAdmissions,
} = require("../controllers/admission.controller");

const { createAdmissionValidator } = require("../validators/admission.validator");

router.use(requireAuth);

router.post(
  "/",
  allowRoles(permissions.ADMIN),
  validate(createAdmissionValidator),
  admitPatient
);

router.get("/", getAdmissions);

module.exports = router;