const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");
const validate = require("../middlewares/validate");

const {
  createHospital,
  getHospitals,
  getHospitalById,
  updateHospital,
  deleteHospital,
} = require("../controllers/admin.hospital.controller");

const {
  createHospitalValidator,
  updateHospitalValidator,
} = require("../validators/hospital.validator");

router.use(requireAuth);

router.use(allowRoles(permissions.SUPER_ADMIN));

// CREATE
router.post("/", validate(createHospitalValidator), createHospital);

// GET ALL
router.get("/", getHospitals);

// GET ONE
router.get("/:id", getHospitalById);

// UPDATE
router.put("/:id", validate(updateHospitalValidator), updateHospital);

// DELETE
router.delete("/:id", deleteHospital);

module.exports = router;