const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const validate = require("../middlewares/validate");
const permissions = require("../middlewares/permissions");
const allowRoles = require("../middlewares/rbac");
const checkOutstandingBills = require("../middlewares/checkOutstandingBills");

const {
  createLabResult,
  getLabResults,
  getLabResultById,
  updateLabResult,
  deleteLabResult,
} = require("../controllers/labResult.controller");

const {
  createLabResultValidator,
  updateLabResultValidator,
} = require("../validators/labResult.validator");

router.use(requireAuth);

router.post(
  "/",
   allowRoles(permissions.LAB_RESULT),
  validate(createLabResultValidator),
  checkOutstandingBills,
  createLabResult
);

router.get("/", getLabResults);

router.get("/:id", getLabResultById);

router.put(
  "/:id",allowRoles(permissions.LAB_RESULT),
  validate(updateLabResultValidator),
  updateLabResult
);

router.delete("/:id", allowRoles(permissions.LAB_RESULT), deleteLabResult);

module.exports = router;