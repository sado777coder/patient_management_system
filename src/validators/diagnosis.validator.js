const Joi = require("joi");

// CREATE DIAGNOSIS
const createDiagnosisValidator = Joi.object({
  visit: Joi.string().required(),
  diagnosedBy: Joi.string().required(),
  symptoms: Joi.string().required(),
  signs: Joi.string().optional().allow(""),
  diagnosis: Joi.string().required(),
  investigations: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional().allow(""),
});

// UPDATE DIAGNOSIS (at least one field)
const updateDiagnosisValidator = createDiagnosisValidator.min(1);

module.exports = {
  createDiagnosisValidator,
  updateDiagnosisValidator,
};