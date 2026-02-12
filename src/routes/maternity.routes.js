const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const validate = require("../middlewares/validate");
const permissions = require("../middlewares/permissions");
const allowRoles = require("../middlewares/rbac");

const {
  createPregnancy,
  getPregnancies,
  createDelivery,
  getDeliveries,
} = require("../controllers/maternity.controller");

const {
  createPregnancyValidator,
} = require("../validators/pregnancy.validator");

const {
  createDeliveryValidator,
} = require("../validators/delivery.validator");

router.use(requireAuth);

/**
 * register pregnancy
 */
router.post(
  "/pregnancies",
  allowRoles(permissions.MATERNITY),
  validate(createPregnancyValidator),
  createPregnancy
);

router.get("/pregnancies", getPregnancies);

/**
 * delivery record
 */
router.post(
  "/deliveries",
  allowRoles(permissions.MATERNITY),
  validate(createDeliveryValidator),
  createDelivery
);

router.get("/deliveries",allowRoles(permissions.MATERNITY), getDeliveries);

module.exports = router;