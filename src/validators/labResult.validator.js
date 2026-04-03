const Joi = require("joi");

const createLabResultValidator = Joi.object({
  labOrder: Joi.string().optional(),

  visit: Joi.string().optional(),
  patient: Joi.string().optional(),

  testName: Joi.string().optional(), // auto-filled if from order
  result: Joi.string().optional(),
  normalRange: Joi.string().optional(),

  amount: Joi.number().required(),

  status: Joi.string()
    .valid("pending", "completed")
    .default("pending"),
})
  // REQUIRE ONE SOURCE OF TRUTH
  .or("labOrder", "patient");

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