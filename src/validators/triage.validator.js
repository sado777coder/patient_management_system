const Joi = require("joi");

/**
 * CREATE TRIAGE
 */
const createTriageValidator = Joi.object({
  visit: Joi.string().required(),

  temperature: Joi.number().min(30).max(45).optional(),

  bloodPressure: Joi.string()
    .pattern(/^\d{2,3}\/\d{2,3}$/)
    .optional()
    .messages({
      "string.pattern.base": "bloodPressure must be like 120/80",
    }),

  pulse: Joi.number().min(20).max(250).optional(),

  weight: Joi.number().min(1).max(500).optional(),

  complaint: Joi.string().trim().optional(),

  priority: Joi.string()
    .valid("low", "medium", "high", "critical")
    .optional(),
});


/**
 * UPDATE TRIAGE
 */
const updateTriageValidator = createTriageValidator.min(1);

module.exports = {
  createTriageValidator,
  updateTriageValidator,
};