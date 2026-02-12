const Joi = require("joi");

/**
 * CREATE BED
 */
const createBedValidator = Joi.object({
  ward: Joi.string().trim().required(),

  bedNumber: Joi.string().trim().required(),

  isOccupied: Joi.boolean().optional(),
});


/**
 * UPDATE BED
 */
const updateBedValidator = Joi.object({
  ward: Joi.string().optional(),
  bedNumber: Joi.string().optional(),
  isOccupied: Joi.boolean().optional(),
}).min(1);

module.exports = {
  createBedValidator,
  updateBedValidator,
};