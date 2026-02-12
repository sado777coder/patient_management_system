const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const validate = require("../middlewares/validate");
const permissions = require("../middlewares/permissions");
const allowRoles = require("../middlewares/rbac");
const cache = require("../middlewares/cache");

const {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  searchPatients
} = require("../controllers/patient.controller");

const {
  createPatientValidator,
  updatePatientValidator,
} = require("../validators/patient.validator");

router.use(requireAuth);

router.post(
  "/",
  allowRoles(permissions.REGISTER_PATIENT),
  validate(createPatientValidator),
  createPatient
);

router.get("/search", searchPatients);

router.get("/", getPatients);

router.get(
  "/:id",
  cache((req) => `patient:${req.params.id}`, 600),
  getPatientById
);

router.put(
  "/:id",
  allowRoles(permissions.REGISTER_PATIENT),
  validate(updatePatientValidator),
  updatePatient
);

router.delete(
  "/:id",
  allowRoles(permissions.REGISTER_PATIENT),
  deletePatient
);

module.exports = router;