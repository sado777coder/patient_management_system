const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const validate = require("../middlewares/validate");
const permissions = require("../middlewares/permissions");
const allowRoles = require("../middlewares/rbac");

const {
  createStock,
  getStocks,
  updateStock,
  deleteStock,
} = require("../controllers/medicationStock.controller");

const {
  createMedicationStockValidator,
  updateMedicationStockValidator,
} = require("../validators/medicationStock.validator");

router.use(requireAuth);

console.log("STOCK ROUTE LOADED | Allowed roles:", permissions.DISPENSE);

router.post(
  "/",
  allowRoles(permissions.DISPENSE),
  validate(createMedicationStockValidator),
  createStock
);

router.get("/", getStocks);

router.put(
  "/:id",
  allowRoles(permissions.DISPENSE),
  validate(updateMedicationStockValidator),
  updateStock
);

router.delete("/:id", allowRoles(permissions.DISPENSE), deleteStock);

module.exports = router;