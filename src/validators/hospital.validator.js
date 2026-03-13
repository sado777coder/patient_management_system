const Joi = require("joi");

/**
 * CREATE HOSPITAL
 */
const createHospitalValidator = Joi.object({
  name: Joi.string().trim().required(),

  code: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z0-9-]+$/)
    .required()
    .messages({
      "string.pattern.base": "Code must contain only letters, numbers and hyphens",
    }),

  address: Joi.string().trim().optional(),

  phone: Joi.string().trim().optional(),

  email: Joi.string().email().optional(),
});


/**
 * UPDATE HOSPITAL
 */
const updateHospitalValidator = Joi.object({
  name: Joi.string().trim().optional(),

  code: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z0-9-]+$/)
    .optional(),

  address: Joi.string().trim().optional(),

  phone: Joi.string().trim().optional(),

  email: Joi.string().email().optional(),
}).min(1);

module.exports = {
  createHospitalValidator,
  updateHospitalValidator,
};