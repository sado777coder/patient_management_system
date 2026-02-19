const router = require("express").Router();
const requireAuth = require("../middlewares/requireAuth");
const cache = require("../middlewares/cache");
const permissions = require("../middlewares/permissions");
const allowRoles = require("../middlewares/rbac");

const {
  submitClaim,
  approveClaim,
  getInsurance
} = require("../controllers/insurance.controller");

router.use(requireAuth);

router.post("/:invoiceId",
  allowRoles(permissions.BILL),
   submitClaim);

router.post("/:claimId/approve",
   allowRoles(permissions.BILL),
   approveClaim);

router.get(
  "/:id/insurance",
  cache((req) => `insurance:${req.params.id}`, 600),
  getInsurance
);

module.exports = router;