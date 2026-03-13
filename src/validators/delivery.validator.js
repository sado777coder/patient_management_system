const Joi = require("joi");

const createDeliveryValidator = Joi.object({
  pregnancy: Joi.string().required(),

  deliveryDate: Joi.date().required(),

  type: Joi.string()
    .valid("normal", "cesarean")
    .required(),

  babyWeight: Joi.number().optional(),

  babyGender: Joi.string()
    .valid("male", "female", "other")
    .optional(),

  complications: Joi.string().optional(),
});

const updateDeliveryValidator = Joi.object({
  pregnancy: Joi.string().optional(),

  deliveryDate: Joi.date().optional(),

  type: Joi.string()
    .valid("normal", "cesarean")
    .optional(),

  babyWeight: Joi.number().optional(),

  babyGender: Joi.string()
    .valid("male", "female", "other")
    .optional(),

  complications: Joi.string().optional(),
}).min(1);

module.exports = {
  createDeliveryValidator,
  updateDeliveryValidator,
};