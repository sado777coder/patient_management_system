const Joi = require("joi");

const createVisitValidator = Joi.object({
  patient: Joi.string().required(),
  doctor: Joi.string().optional(),

  visitDate: Joi.date().optional(),

  type: Joi.string()
    .valid("outpatient", "inpatient", "emergency")
    .required(),

  notes: Joi.string().optional(),
});

const updateVisitValidator = createVisitValidator.min(1);

module.exports = {
  createVisitValidator,
  updateVisitValidator,
};