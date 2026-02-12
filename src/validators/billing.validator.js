const Joi = require("joi");

// reusable objectId validator
const objectId = Joi.string().hex().length(24);

/**
 * CHARGE VALIDATION
 */
const createChargeValidator = Joi.object({
  patient: objectId.required(),

  amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      "number.positive": "Charge amount must be greater than 0",
    }),

  description: Joi.string().min(3).max(255).required(),
});


/**
 * PAYMENT VALIDATION
 */
const payBillValidator = Joi.object({
  patient: objectId.required(),

  amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      "number.positive": "Payment amount must be greater than 0",
    }),
});


/**
 * REFUND VALIDATION
 */
const refundValidator = Joi.object({
  patient: objectId.required(),

  amount: Joi.number()
    .positive()
    .precision(2)
    .required(),

  description: Joi.string().min(3).max(255).optional(),
});


/**
 * PARAM VALIDATOR (patientId)
 */
const patientIdParamValidator = Joi.object({
  patientId: objectId.required(),
});


module.exports = {
  createChargeValidator,
  payBillValidator,
  refundValidator,
  patientIdParamValidator,
};