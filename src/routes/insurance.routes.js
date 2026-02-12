const router = require("express").Router();
const requireAuth = require("../middlewares/requireAuth");
const cache = require("../middlewares/cache");

const {
  submitClaim,
  approveClaim,
  getInsurance
} = require("../controllers/insurance.controller");

router.use(requireAuth);

router.post("/:invoiceId", submitClaim);
router.post("/:claimId/approve", approveClaim);

router.get(
  "/:id/insurance",
  cache((req) => `insurance:${req.params.id}`, 600),
  getInsurance
);

module.exports = router;