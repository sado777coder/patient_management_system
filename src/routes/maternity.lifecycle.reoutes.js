const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");
const validate = require("../middlewares/validate");

const {
  createAbortionValidator,
} = require("../validators/abortion.validator");
const {
  createPostnatalValidator,
} = require("../validators/postnatal.validator");
const {
  createReferralValidator,
} = require("../validators/referral.validator");

const {
  createAbortion,
  getAbortions,
  getAbortionById,
  createPostnatalVisit,
  getPostnatalVisits,
  getPostnatalVisitById,
  createReferral,
  getReferrals,
  getReferralById,
} = require("../controllers/maternity.lifecycle.controller");

router.use(requireAuth);

 //ABORTIONS

router.post(
  "/abortions",
  allowRoles(permissions.MATERNITY),
  validate(createAbortionValidator),
  createAbortion
);

router.get(
  "/abortions",
  allowRoles(permissions.MATERNITY),
  getAbortions
);

router.get(
  "/abortions/:id",
  allowRoles(permissions.MATERNITY),
  getAbortionById
);

 // POSTNATAL VISITS

router.post(
  "/postnatal-visits",
  allowRoles(permissions.MATERNITY),
  validate(createPostnatalValidator),
  createPostnatalVisit
);

router.get(
  "/postnatal-visits",
  allowRoles(permissions.MATERNITY),
  getPostnatalVisits
);

router.get(
  "/postnatal-visits/:id",
  allowRoles(permissions.MATERNITY),
  getPostnatalVisitById
);


 //REFERRALS
 
router.post(
  "/referrals",
  allowRoles(permissions.MATERNITY),
  validate(createReferralValidator),
  createReferral
);

router.get(
  "/referrals",
  allowRoles(permissions.MATERNITY),
  getReferrals
);

router.get(
  "/referrals/:id",
  allowRoles(permissions.MATERNITY),
  getReferralById
);

module.exports = router;