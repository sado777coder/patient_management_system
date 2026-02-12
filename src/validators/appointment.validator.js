const Joi = require("joi");

// CREATE APPOINTMENT
const createAppointmentValidator = Joi.object({
  doctorName: Joi.string()
    .trim()
    .required(),

  clinicName: Joi.string()
    .trim()
    .required(),

  appointmentDateTime: Joi.date()
    .iso()
    .required()
    .messages({
      "date.base": "appointmentDateTime must be a valid date",
      "date.format": "appointmentDateTime must be in ISO format"
    }),

  status: Joi.string()
    .valid("scheduled", "completed", "cancelled")
    .default("scheduled"),

  notes: Joi.string()
    .trim()
    .optional()
});

// UPDATE APPOINTMENT (at least one field required)
const updateAppointmentValidator = Joi.object({
  doctorName: Joi.string()
    .trim()
    .optional(),

  clinicName: Joi.string()
    .trim()
    .optional(),

  appointmentDateTime: Joi.date()
    .iso()
    .optional()
    .messages({
      "date.base": "appointmentDateTime must be a valid date",
      "date.format": "appointmentDateTime must be in ISO format"
    }),

  status: Joi.string()
    .valid("scheduled", "completed", "cancelled")
    .optional(),

  notes: Joi.string()
    .trim()
    .optional(),

  // REQUIRED FOR REMINDERS
  reminderSent: Joi.boolean()
    .optional()
}).min(1);

module.exports = {
  createAppointmentValidator,
  updateAppointmentValidator
};