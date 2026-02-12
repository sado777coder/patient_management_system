const Joi = require("joi");

// REGISTER USER
const registerUserValidator = Joi.object({
  name: Joi.string().min(2).required(),

  email: Joi.string()
    .email()
    .required(),

  password: Joi.string()
    .min(6)
    .required(),
    role: Joi.string()
    .valid("admin",
       "doctor",
        "nurse", "lab_technician", 
        "pharmacist",
        "record_officer",
        "physician_assistant",
        "midwife",
        "revenue_officer")
    .required(),
});

// LOGIN USER
const loginUserValidator = Joi.object({
  email: Joi.string()
    .email()
    .required(),

  password: Joi.string().required(),
});

module.exports = {
  registerUserValidator,
  loginUserValidator,
};