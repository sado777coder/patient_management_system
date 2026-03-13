const Joi = require("joi");

const createLabResultValidator = Joi.object({
  visit: Joi.string().required(),
  patient: Joi.string().required(),

  testName: Joi.string().required(),
  result: Joi.string().optional(),
  normalRange: Joi.string().optional(),

  amount: Joi.number().required(),

  status: Joi.string()
    .valid("pending", "completed")
    .default("pending"),
});

const updateLabResultValidator = Joi.object({
  visit: Joi.string().optional(),
  patient: Joi.string().optional(),

  testName: Joi.string().optional(),
  result: Joi.string().optional(),
  normalRange: Joi.string().optional(),

  amount: Joi.number().optional(),

  status: Joi.string()
    .valid("pending", "completed")
    .optional(),
}).min(1);

module.exports = {
  createLabResultValidator,
  updateLabResultValidator,
};