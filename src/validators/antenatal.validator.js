const Joi = require("joi");

const objectId = /^[0-9a-fA-F]{24}$/;

const createAntenatalVisitValidator = Joi.object({
  pregnancy: Joi.string()
    .pattern(objectId)
    .required(),

  visitDate: Joi.date().required(),

  gestationalAgeWeeks: Joi.number()
    .integer()
    .min(0)
    .optional(),

  bloodPressure: Joi.string().optional(),

  weight: Joi.number().optional(),

  fetalHeartRate: Joi.number().optional(),

  riskLevel: Joi.string()
    .valid("low", "medium", "high")
    .optional(),

  notes: Joi.string().optional(),
});

const updateAntenatalVisitValidator = Joi.object({
  pregnancy: Joi.string().pattern(objectId).optional(),

  visitDate: Joi.date().optional(),

  gestationalAgeWeeks: Joi.number().integer().min(0).optional(),

  bloodPressure: Joi.string().optional(),

  weight: Joi.number().optional(),

  fetalHeartRate: Joi.number().optional(),

  riskLevel: Joi.string()
    .valid("low", "medium", "high")
    .optional(),

  notes: Joi.string().optional(),
}).min(1);

module.exports = {
  createAntenatalVisitValidator,
  updateAntenatalVisitValidator,
};