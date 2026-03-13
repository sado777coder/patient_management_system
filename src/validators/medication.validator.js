const Joi = require("joi");

/**
 * CREATE MEDICATION
 */
const createMedicationValidator = Joi.object({
  name: Joi.string().trim().required(),

  form: Joi.string()
    .trim()
    .valid("tablet", "capsule", "syrup", "injection", "cream", "ointment", "drop")
    .optional(),

  strength: Joi.string().trim().optional(),

  category: Joi.string().trim().optional(),
});


/**
 * UPDATE MEDICATION
 */
const updateMedicationValidator = Joi.object({
  name: Joi.string().trim().optional(),

  form: Joi.string()
    .trim()
    .valid("tablet", "capsule", "syrup", "injection", "cream", "ointment", "drop")
    .optional(),

  strength: Joi.string().trim().optional(),

  category: Joi.string().trim().optional(),
}).min(1);

module.exports = {
  createMedicationValidator,
  updateMedicationValidator,
};