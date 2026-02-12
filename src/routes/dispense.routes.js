const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const validate = require("../middlewares/validate");
const checkOutstandingBills = require("../middlewares/checkOutstandingBills");
const permissions = require("../middlewares/permissions");
const allowRoles = require("../middlewares/rbac");

const {
  createDispense,
  getDispenses,
} = require("../controllers/dispense.controller");

const { createDispenseValidator } = require("../validators/dispense.validator");

router.use(requireAuth);


router.post(
  "/",
  allowRoles(permissions.DISPENSE),
  validate(createDispenseValidator),
  checkOutstandingBills, //   blocks unpaid patients FIRST
  createDispense
);

router.get("/", getDispenses);

module.exports = router;