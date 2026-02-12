const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const validate = require("../middlewares/validate");
const requireConsultationFee = require("../middlewares/requireConsultationFee");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");
const checkOutstandingBills = require("../middlewares/checkOutstandingBills");

const {
  createVisit,
  getVisits,
  getVisitById,
  updateVisit,
  deleteVisit,
} = require("../controllers/visit.controller");

const {
  createVisitValidator,
  updateVisitValidator,
} = require("../validators/visit.validator");

router.use(requireAuth);

router.post(
  "/",
  allowRoles(permissions.REGISTER_PATIENT),
  validate(createVisitValidator),
  requireConsultationFee, // auto add GHC20
  checkOutstandingBills,
  createVisit
);

router.get("/", getVisits);

router.get("/:id", getVisitById);

router.put("/:id",allowRoles(permissions.REGISTER_PATIENT),
validate(updateVisitValidator), updateVisit);

router.delete("/:id", allowRoles(permissions.REGISTER_PATIENT), deleteVisit);

module.exports = router;