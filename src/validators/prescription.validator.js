const Joi = require("joi");

const createPrescriptionValidator = Joi.object({
  visit: Joi.string().required(),

  medications: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        dosage: Joi.string().required(),
        frequency: Joi.string().required(),
        duration: Joi.string().required(),
      })
    )
    .min(1)
    .required(),

  prescribedBy: Joi.string().required(),
});

const updatePrescriptionValidator = createPrescriptionValidator.min(1);

module.exports = {
  createPrescriptionValidator,
  updatePrescriptionValidator,
};