const Joi = require("joi");

/**
 * ADMIT PATIENT
 */
const createAdmissionValidator = Joi.object({
  patient: Joi.string().required(),

  visit: Joi.string().optional(),
  ward:Joi.string().required(),

  bed: Joi.string().required(),
});


/**
 * UPDATE ADMISSION
 */
const updateAdmissionValidator = Joi.object({
  ward:Joi.string().optional(),
  bed: Joi.string().optional(),

  status: Joi.string()
    .valid("admitted", "discharged")
    .optional(),
}).min(1);

module.exports = {
  createAdmissionValidator,
  updateAdmissionValidator,
};