const Joi = require("joi");

const createDispenseValidator = Joi.object({
  patient: Joi.string().required(),
  prescription: Joi.string().optional(),

  items: Joi.array().items(
  Joi.object({
    name: Joi.string().required(),   // medication name
    quantity: Joi.number().required(),
    price: Joi.number().required()   // pharmacist enters price
  })
)
    .min(1)
    .required()
});

module.exports = {
  createDispenseValidator,
};