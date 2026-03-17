const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");
const validate = require("../middlewares/validate");

const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
} = require("../controllers/appointment.controller");

const {
  createAppointmentValidator,
  updateAppointmentValidator,
} = require("../validators/appointment.validator");

// REQUIRE AUTH FOR ALL ROUTES
router.use(requireAuth);

// CREATE APPOINTMENT
router.post(
  "/",
  allowRoles(permissions.REGISTER_PATIENT, permissions.MANAGE_USERS),
  validate(createAppointmentValidator),
  createAppointment
);

// GET ALL APPOINTMENTS
router.get("/", getAppointments);

// GET SINGLE APPOINTMENT
router.get("/:id", getAppointmentById);

// UPDATE APPOINTMENT
router.put(
  "/:id",
  allowRoles(permissions.REGISTER_PATIENT, permissions.MANAGE_USERS),
  validate(updateAppointmentValidator),
  updateAppointment
);

// DELETE APPOINTMENT
router.delete(
  "/:id",
  allowRoles(permissions.REGISTER_PATIENT, permissions.MANAGE_USERS),
  deleteAppointment
);

module.exports = router;