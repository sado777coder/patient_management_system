const Joi = require("joi");

// CREATE DIAGNOSIS
const createDiagnosisValidator = Joi.object({
  visit: Joi.string().required(),
  symptoms: Joi.string().required(),
  signs: Joi.string().optional().allow(""),
  diagnosis: Joi.string().required(),
  investigations: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional().allow(""),
});

// UPDATE DIAGNOSIS
const updateDiagnosisValidator = Joi.object({
  symptoms: Joi.string().optional(),
  signs: Joi.string().optional().allow(""),
  diagnosis: Joi.string().optional(),
  investigations: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional().allow(""),
}).min(1);

module.exports = {
  createDiagnosisValidator,
  updateDiagnosisValidator,
};