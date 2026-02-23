const Joi = require("joi");

const createPatientValidator = Joi.object({
  // hospitalId auto-generated → DO NOT accept from client
  hospitalId: Joi.forbidden(),

  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),

  gender: Joi.string()
    .valid("male", "female", "other")
    .required(),

  dateOfBirth: Joi.date().optional(),

  phone: Joi.string().trim().optional(),
  email: Joi.string().email().optional(),
  address: Joi.string().trim().optional(),

  nationality: Joi.string().allow(null, "").optional(),

  maritalStatus: Joi.string().valid(
    "single",
    "married",
    "divorced",
    "widow",
    "widower",
    "cohabiting"
  ).allow(null).optional(),

  occupation: Joi.string().valid(
    "farmer",
    "tailor",
    "seamstress",
    "student",
    "teacher",
    "fisher",
    "health_provider",
    "trader",
    "driver",
    "civil_servant",
    "unemployed",
    "other"
  ).optional(),

  bloodGroup: Joi.string().optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  chronicConditions: Joi.array().items(Joi.string()).optional(),

  emergencyContact: Joi.object({
    name: Joi.string().optional(),
    phone: Joi.string().optional(),
    relation: Joi.string().optional(),
  }).optional(),

  insurance: Joi.object({
    provider: Joi.string().allow(null, ""),
    policyNumber: Joi.string().allow(null, ""),
    expiryDate: Joi.date().allow(null),
    isActive: Joi.boolean(),
  }).optional(),

  unit: Joi.string().required(),
});


// UPDATE (at least one field)
const updatePatientValidator = createPatientValidator
  .fork(Object.keys(createPatientValidator.describe().keys), field =>
    field.optional()
  )
  .min(1);

module.exports = {
  createPatientValidator,
  updatePatientValidator,
};