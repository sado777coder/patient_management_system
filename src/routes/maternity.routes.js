const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const validate = require("../middlewares/validate");
const permissions = require("../middlewares/permissions");
const allowRoles = require("../middlewares/rbac");

const {
  createAntenatalVisitValidator,
} = require("../validators/antenatal.validator");
const {
  createPregnancyValidator,
} = require("../validators/pregnancy.validator");
const {
  createDeliveryValidator,
} = require("../validators/delivery.validator");

const {
  createPregnancy,
  getPregnancies,
  getPregnancyById,
  createAntenatalVisit,
  getAntenatalVisits,
  getAntenatalVisitById,
  createDelivery,
  getDeliveries,
  getDeliveryById,
  getPregnancySummary
} = require("../controllers/maternity.controller");

router.use(requireAuth);

 // register pregnancy

router.post(
  "/pregnancies",
  allowRoles(permissions.MATERNITY),
  validate(createPregnancyValidator),
  createPregnancy
);

router.get("/pregnancies",
  allowRoles(permissions.MATERNITY),
   getPregnancies);

   router.get("/pregnancies/:id",
  allowRoles(permissions.MATERNITY),
   getPregnancyById);

 //ANTENATAL VISITS

router.post(
  "/antenatal-visits",
  allowRoles(permissions.MATERNITY),
  validate(createAntenatalVisitValidator),
  createAntenatalVisit
);

router.get(
  "/antenatal-visits",
  allowRoles(permissions.MATERNITY),
  getAntenatalVisits
);

router.get(
  "/antenatal-visits/:id",
  allowRoles(permissions.MATERNITY),
  getAntenatalVisitById
)

 //delivery record
router.post(
  "/deliveries",
  allowRoles(permissions.MATERNITY),
  validate(createDeliveryValidator),
  createDelivery
);

router.get("/deliveries",
  allowRoles(permissions.MATERNITY),
   getDeliveries);

   router.get("/deliveries/:id",
  allowRoles(permissions.MATERNITY),
   getDeliveryById);

router.get(
  "/pregnancies/:id/summary",
  allowRoles(permissions.MATERNITY),
  getPregnancySummary
);

module.exports = router;