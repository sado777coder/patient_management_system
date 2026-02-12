const router = require("express").Router();

const validate = require("../middlewares/validate");
const requireAuth = require("../middlewares/requireAuth");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");

const {
  createCharge,
  payBill,
  refund,
  getPaymentHistory,
  generateInvoice,
} = require("../controllers/billing.controller");

const {
  createChargeValidator,
  payBillValidator,
  refundValidator,
  patientIdParamValidator,
} = require("../validators/billing.validator");

router.use(requireAuth);

// CHARGE
router.post(
  "/charge",
  allowRoles(permissions.BILL),
  validate(createChargeValidator),
  createCharge
);

// PAY
router.post(
  "/pay",
  allowRoles(permissions.BILL),
  validate(payBillValidator),
  payBill
);

// REFUND (admin only)
router.post(
  "/refund",
  allowRoles(permissions.MANAGE_USERS),
  validate(refundValidator),
  refund
);

// HISTORY
router.get(
  "/history/:patientId",
  validate(patientIdParamValidator, "params"),
  getPaymentHistory
);

//INVOICE
router.get(
  "/invoice/:patientId",
  validate(patientIdParamValidator, "params"),
  generateInvoice
);

module.exports = router;