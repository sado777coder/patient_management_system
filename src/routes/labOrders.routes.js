const express = require("express");
const router = express.Router();
const requireAuth = require("../middlewares/requireAuth");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");
const {
  createLabOrder,
  getLabOrder,
  getDiagnosisLabOrders,
  updateLabOrder,
} = require("../controllers/labOrders.controller");
const { createLabOrderValidator, updateLabOrderValidator } = require("../validators/labOrder.validator");
const validate = require("../middlewares/validate"); // Joi middleware

router.use( requireAuth);
router.post("/", 
    allowRoles(permissions.PRESCRIBE),
    validate(createLabOrderValidator), createLabOrder);
router.get("/:id", getLabOrder);
router.get("/diagnosis/:diagnosisId", getDiagnosisLabOrders);
router.patch("/:id", 
    allowRoles(permissions.PRESCRIBE),
    validate(updateLabOrderValidator), updateLabOrder);

module.exports = router;