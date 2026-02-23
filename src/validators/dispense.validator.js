const Joi = require("joi");

const createDispenseValidator = Joi.object({
  patient: Joi.string().required(),
  prescription: Joi.string().optional(),

  items: Joi.array()
    .items(
      Joi.object({
        medication: Joi.string().required(), // ObjectId reference
        quantity: Joi.number().required(),
        price: Joi.number().required(),
      })
    )
    .min(1)
    .required(),
});

module.exports = {
  createDispenseValidator,
};