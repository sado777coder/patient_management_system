const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");
const validate = require("../middlewares/validate");

const {
  createTriage,
  getTriages,
  updateTriage,
  deleteTriage,
} = require("../controllers/triage.controller");

const {
  createTriageValidator,
  updateTriageValidator,
} = require("../validators/triage.validator");

router.use(requireAuth);

router.post(
  "/",
  allowRoles(permissions.TRIAGE),
  validate(createTriageValidator),
  createTriage
);

router.get("/", getTriages);

router.put(
  "/:id",
  allowRoles(permissions.TRIAGE),
  validate(updateTriageValidator),
  updateTriage
);

router.delete("/:id",  allowRoles(permissions.TRIAGE), deleteTriage);

module.exports = router;