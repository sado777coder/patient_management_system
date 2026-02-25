const Joi = require("joi");

const objectId = /^[0-9a-fA-F]{24}$/;

const createAbortionValidator = Joi.object({
  pregnancy: Joi.string()
    .pattern(objectId)
    .required(),

  date: Joi.date().required(),

  type: Joi.string()
    .valid("spontaneous", "induced")
    .required(),

  gestationalAgeWeeks: Joi.number()
    .integer()
    .min(0)
    .optional(),

  complications: Joi.string().optional(),

  notes: Joi.string().optional(),
});

const updateAbortionValidator = createAbortionValidator.min(1);

module.exports = {
  createAbortionValidator,
  updateAbortionValidator,
};