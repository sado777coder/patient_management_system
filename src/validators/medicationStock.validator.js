const Joi = require("joi");

const createMedicationStockValidator = Joi.object({
  name: Joi.string().required(),
  batchNumber: Joi.string().required(),

  quantity: Joi.number().min(0).required(),
  unitPrice: Joi.number().min(0).required(),

  expiryDate: Joi.date().optional(),
  supplier: Joi.string().optional(),
});

const updateMedicationStockValidator = createMedicationStockValidator.min(1);

module.exports = {
  createMedicationStockValidator,
  updateMedicationStockValidator,
};