const Joi = require("joi");

const createMedicationStockValidator = Joi.object({
  name: Joi.string().required(),
  batchNumber: Joi.string().required(),

  quantity: Joi.number().min(0).required(),
  unitPrice: Joi.number().min(0).required(),

  expiryDate: Joi.date().optional(),
  supplier: Joi.string().optional(),
});

// Update → all optional but at least one required
const updateMedicationStockValidator = Joi.object({
  name: Joi.string().optional(),
  batchNumber: Joi.string().optional(),

  quantity: Joi.number().min(0).optional(),
  unitPrice: Joi.number().min(0).optional(),

  expiryDate: Joi.date().optional(),
  supplier: Joi.string().optional(),
}).min(1);

module.exports = {
  createMedicationStockValidator,
  updateMedicationStockValidator,
};