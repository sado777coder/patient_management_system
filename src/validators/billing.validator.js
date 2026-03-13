const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

// helper for currency
const money = Joi.number()
  .positive()
  .precision(2)
  .required()
  .messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be greater than 0",
    "number.precision": "Amount can have at most 2 decimal places",
  });

/**
 * CHARGE VALIDATION
 */
const createChargeValidator = Joi.object({
  patient: objectId.required(),
  visit: objectId.optional(),
  amount: money,
  description: Joi.string().min(3).max(255).required(),
});

/**
 * PAYMENT VALIDATION
 */
const payBillValidator = Joi.object({
  patient: objectId.required(),
  visit: objectId.optional(), 
  amount: money,
});

/**
 * REFUND VALIDATION
 */
const refundValidator = Joi.object({
  patient: objectId.required(),
  visit: objectId.optional(), 
  amount: money,
  description: Joi.string().min(3).max(255).optional(),
});

/**
 * PARAM VALIDATOR
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