const Joi = require("joi");

// CREATE LAB ORDER
const createLabOrderValidator = Joi.object({
  diagnosis: Joi.string().required(),
  requestedBy: Joi.string().required(),
  tests: Joi.array().items(Joi.string()).min(1).required(),
});

// UPDATE LAB ORDER (status/results)
const updateLabOrderValidator = Joi.object({
  status: Joi.string().valid("pending", "completed").optional(),
  results: Joi.array().items(
    Joi.object({
      test: Joi.string().required(),
      result: Joi.string().required(),
      normalRange: Joi.string().optional(),
    })
  ).optional(),
}).min(1);

module.exports = {
  createLabOrderValidator,
  updateLabOrderValidator,
};