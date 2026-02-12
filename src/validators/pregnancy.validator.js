const Joi = require("joi");

const createPregnancyValidator = Joi.object({
  patient: Joi.string().required(),

  lastMenstrualPeriod: Joi.date().optional(),
  expectedDeliveryDate: Joi.date().optional(),

  riskLevel: Joi.string()
    .valid("low", "medium", "high")
    .default("low"),

  notes: Joi.string().optional(),
});

const updatePregnancyValidator = createPregnancyValidator.min(1);

module.exports = {
  createPregnancyValidator,
  updatePregnancyValidator,
};