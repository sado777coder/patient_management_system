const Joi = require("joi");

const createLabResultValidator = Joi.object({
  visit: Joi.string().required(),

  testName: Joi.string().required(),
  result: Joi.string().optional(),
  normalRange: Joi.string().optional(),

  status: Joi.string()
    .valid("pending", "completed")
    .default("pending"),
});

const updateLabResultValidator = createLabResultValidator.min(1);

module.exports = {
  createLabResultValidator,
  updateLabResultValidator,
};