const Joi = require("joi");

const createPrescriptionValidator = Joi.object({
  visit: Joi.string().required(),

  diagnosis: Joi.string().required(),

  medications: Joi.array()
    .items(
      Joi.object({
        medication: Joi.string().required(), 
        dosage: Joi.string().required(),
        frequency: Joi.string().required(),
        duration: Joi.string().required(),
      })
    )
    .min(1)
    .required(),
});

const updatePrescriptionValidator = Joi.object({
  medications: Joi.array().items(
    Joi.object({
      medication: Joi.string(),
      dosage: Joi.string(),
      frequency: Joi.string(),
      duration: Joi.string(),
    })
  ),
}).min(1);

module.exports = {
  createPrescriptionValidator,
  updatePrescriptionValidator,
};