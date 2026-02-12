const Joi = require("joi");

/**
 * DISCHARGE PATIENT
 */
const createDischargeValidator = Joi.object({
  admission: Joi.string().required(),

  summary: Joi.string()
    .trim()
    .min(5)
    .required(),
});

module.exports = {
  createDischargeValidator,
};