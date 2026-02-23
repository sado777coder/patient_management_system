const Joi = require("joi");

const createMedicalRecordValidator = Joi.object({
  visit: Joi.string().required(),

  diagnosis: Joi.string().optional(),
  symptoms: Joi.array().items(Joi.string()).optional(),
  treatmentPlan: Joi.string().optional(),
  notes: Joi.string().optional(),

  createdBy: Joi.string().required(),
});

const updateMedicalRecordValidator = Joi.object({
  diagnosis: Joi.string().optional(),
  symptoms: Joi.array().items(Joi.string()).optional(),
  treatmentPlan: Joi.string().optional(),
  notes: Joi.string().optional(),
})
  .min(1);

module.exports = {
  createMedicalRecordValidator,
  updateMedicalRecordValidator,
};