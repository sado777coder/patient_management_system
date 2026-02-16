const Joi = require("joi");

/**
 * CREATE TRIAGE
 */
const createTriageValidator = Joi.object({
  visit: Joi.string().required(),

  // Vitals grouped under `vitals`
  vitals: Joi.object({
    temperature: Joi.number().min(30).max(45).optional(),
    bloodPressure: Joi.string()
      .pattern(/^\d{2,3}\/\d{2,3}$/)
      .optional()
      .messages({
        "string.pattern.base": "bloodPressure must be like 120/80",
      }),
    heartRate: Joi.number().min(20).max(250).optional(),
    respiratoryRate: Joi.number().min(5).max(60).optional(),
    pulse:Joi.number().min(0).max(200).optional(),
    oxygenSaturation: Joi.number().min(50).max(100).optional(),
    weight: Joi.number().min(1).max(500).optional(),
    height: Joi.number().min(30).max(300).optional(),
  }).optional(),

  complaint: Joi.string().trim().optional(),

  priority: Joi.string()
    .valid("low", "medium", "high", "critical")
    .optional(),

  triagedBy: Joi.string().required(), // required user id performing triage
});

/**
 * UPDATE TRIAGE
 * At least one field should be provided
 */
const updateTriageValidator = createTriageValidator.min(1);

module.exports = {
  createTriageValidator,
  updateTriageValidator,
};