const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const validate = require("../middlewares/validate");
const permissions = require("../middlewares/permissions");
const allowRoles = require("../middlewares/rbac");

const {
  createPrescription,
  getPrescriptions,
  updatePrescription,
  deletePrescription,
} = require("../controllers/prescription.controller");

const {
  createPrescriptionValidator,
  updatePrescriptionValidator,
} = require("../validators/prescription.validator");

router.use(requireAuth);

router.post(
  "/",
  allowRoles(permissions.PRESCRIBE),
  validate(createPrescriptionValidator),
  createPrescription
);

router.get("/", getPrescriptions);

router.put(
  "/:id",
   allowRoles(permissions.PRESCRIBE),
  validate(updatePrescriptionValidator),
  updatePrescription
);

router.delete("/:id", allowRoles(permissions.PRESCRIBE), deletePrescription);

module.exports = router;