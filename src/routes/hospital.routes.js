const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");
const validate = require("../middlewares/validate");

const {
  getMyHospital,
  updateMyHospital,
} = require("../controllers/hospital.controller");

const { updateHospitalValidator } = require("../validators/hospital.validator");

router.use(requireAuth);

// Get logged-in hospital
router.get("/", getMyHospital);

// Update hospital (restricted fields)
router.put(
  "/",
  allowRoles(permissions.MANAGE_USERS),
  validate(updateHospitalValidator),
  updateMyHospital
);

module.exports = router;