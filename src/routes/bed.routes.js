const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");
const validate = require("../middlewares/validate");

const {
  createBed,
  getBeds,
  updateBed,
  deleteBed,
} = require("../controllers/bed.controller");

const {
  createBedValidator,
  updateBedValidator,
} = require("../validators/bed.validator");

router.use(requireAuth);

router.post("/", allowRoles(permissions.TRIAGE,permissions.ADMIN), 
validate(createBedValidator), createBed);

router.get("/", getBeds);

router.put("/:id",allowRoles(permissions.TRIAGE,permissions.ADMIN),
 validate(updateBedValidator), updateBed);

router.delete("/:id", allowRoles(permissions.TRIAGE,permissions.ADMIN),
 deleteBed);

module.exports = router;