const Joi = require("joi");

// CREATE APPOINTMENT
const createAppointmentValidator = Joi.object({
  patient: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.empty": "Patient is required",
      "string.length": "Invalid patient ID",
    }),

  doctor: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.empty": "Doctor is required",
      "string.length": "Invalid doctor ID",
    }),

  date: Joi.date()
    .iso()
    .required()
    .messages({
      "date.base": "Date must be valid",
      "date.format": "Date must be in ISO format",
    }),

  reason: Joi.string()
    .trim()
    .optional(),

  status: Joi.string()
    .valid("scheduled", "completed", "cancelled")
    .default("scheduled"),
});

// UPDATE APPOINTMENT
const updateAppointmentValidator = Joi.object({
  patient: Joi.string().hex().length(24).optional(),

  doctor: Joi.string().hex().length(24).optional(),

  date: Joi.date().iso().optional(),

  reason: Joi.string().trim().optional(),

  status: Joi.string()
    .valid("scheduled", "completed", "cancelled")
    .optional(),
}).min(1);

module.exports = {
  createAppointmentValidator,
  updateAppointmentValidator,
};