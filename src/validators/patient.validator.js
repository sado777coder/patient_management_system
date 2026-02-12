const Joi = require("joi");

const createPatientValidator = Joi.object({
  // hospitalId auto-generated → DO NOT accept from client
  hospitalId: Joi.forbidden(),

  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),

  gender: Joi.string()
    .valid("male", "female", "other")
    .required(),

  dateOfBirth: Joi.date().required(),

  phone: Joi.string().trim().required(),
  email: Joi.string().email().optional(),
  address: Joi.string().trim().required(),

  nationality: Joi.string().required(),

  maritalStatus: Joi.string().valid(
    "single",
    "married",
    "divorced",
    "widow",
    "widower",
    "cohabiting"
  ).required(),

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
  ).required(),

  bloodGroup: Joi.string().optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  chronicConditions: Joi.array().items(Joi.string()).optional(),

  emergencyContact: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
    relation: Joi.string().required(),
  }).required(),

  insurance: Joi.object({
    provider: Joi.string().allow(null, ""),
    policyNumber: Joi.string().allow(null, ""),
    expiryDate: Joi.date(),
    isActive: Joi.boolean(),
  }).required(),

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