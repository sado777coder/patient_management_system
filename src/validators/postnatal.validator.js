const Joi = require("joi");

const objectId = /^[0-9a-fA-F]{24}$/;

const createPostnatalValidator = Joi.object({
  pregnancy: Joi.string()
    .pattern(objectId)
    .required(),

  visitDate: Joi.date().required(),

  motherCondition: Joi.string().optional(),

  bloodPressure: Joi.string().optional(),

  temperature: Joi.number().optional(),

  complications: Joi.string().optional(),

  notes: Joi.string().optional(),
});

const updatePostnatalValidator = createPostnatalValidator.min(1);

module.exports = {
  createPostnatalValidator,
  updatePostnatalValidator,
};