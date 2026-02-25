const Joi = require("joi");

const objectId = /^[0-9a-fA-F]{24}$/;

const createReferralValidator = Joi.object({
  pregnancy: Joi.string()
    .pattern(objectId)
    .required(),

  referredTo: Joi.string().required(),

  reason: Joi.string().required(),

  referralDate: Joi.date().required(),

  status: Joi.string()
    .valid("pending", "completed")
    .optional(),

  notes: Joi.string().optional(),
});

const updateReferralValidator = createReferralValidator.min(1);

module.exports = {
  createReferralValidator,
  updateReferralValidator,
};