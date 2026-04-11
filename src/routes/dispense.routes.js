const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const validate = require("../middlewares/validate");
const checkOutstandingBills = require("../middlewares/checkOutstandingBills");
const permissions = require("../middlewares/permissions");
const allowRoles = require("../middlewares/rbac");

const {
  createDispense,
  getDispenses,
  searchDispenses,
  updateDispense,
  deleteDispense
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

router.get("/search", searchDispenses);

router.get("/", getDispenses);

router.put("/:id", 
  allowRoles(permissions.DISPENSE),
  updateDispense

);

router.delete("/:id",
  allowRoles(permissions.DISPENSE),
  deleteDispense
);

module.exports = router;