const Joi = require("joi");

// REGISTER USER
const registerUserValidator = Joi.object({
  name: Joi.string().min(2).trim().required(),

  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required(),

  password: Joi.string()
    .min(8)
    .required(),

  role: Joi.string()
    .valid(
      "admin",
      "doctor",
      "nurse",
      "lab_technician",
      "pharmacist",
      "record_officer",
      "physician_assistant",
      "midwife",
      "revenue_officer"
    )
    .required(),

  hospital: Joi.string().optional(),
});

// LOGIN USER
const loginUserValidator = Joi.object({
  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required(),

  password: Joi.string().required(),
});

module.exports = {
  registerUserValidator,
  loginUserValidator,
};