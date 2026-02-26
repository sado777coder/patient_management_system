const Joi = require("joi");

const objectId = /^[0-9a-fA-F]{24}$/;

const createPregnancyValidator = Joi.object({
  patient: Joi.string()
    .pattern(objectId)
    .required(),

  gravida: Joi.number()
    .integer()
    .min(0)
    .required(),

  para: Joi.number()
    .integer()
    .min(0)
    .required(),

  lastMenstrualPeriod: Joi.date().optional(),

  expectedDeliveryDate: Joi.date().optional(),

  riskLevel: Joi.string()
    .valid("low", "medium", "high")
    .default("low"),

  notes: Joi.string().optional(),
});

const updatePregnancyValidator = Joi.object({
  patient: Joi.string().pattern(objectId),
  gravida: Joi.number().integer().min(0),
  para: Joi.number().integer().min(0),
  lastMenstrualPeriod: Joi.date(),
  expectedDeliveryDate: Joi.date(),
  riskLevel: Joi.string().valid("low", "medium", "high"),
  notes: Joi.string(),
}).min(1);

module.exports = {
  createPregnancyValidator,
  updatePregnancyValidator,
};