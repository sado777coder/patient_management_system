const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");
const validate = require("../middlewares/validate");

const {
  dischargePatient,
  getDischarges,
} = require("../controllers/discharge.controller");

const { createDischargeValidator } = require("../validators/discharge.validator");

router.use(requireAuth);

router.post(
  "/",
  allowRoles(permissions.ADMIN),
  validate(createDischargeValidator),
  dischargePatient
);

router.get("/", getDischarges);

module.exports = router;