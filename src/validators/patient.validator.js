const Joi = require("joi");

/**
 * ===============================
 * CREATE PATIENT VALIDATOR
 * ===============================
 */
const createPatientValidator = Joi.object({
  // Auto-generated → never allow client to send it
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

  maritalStatus: Joi.string()
    .valid(
      "single",
      "married",
      "divorced",
      "widow",
      "widower",
      "cohabiting"
    )
    .allow(null)
    .optional(),

  occupation: Joi.string()
    .valid(
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
    )
    .optional(),

  bloodGroup: Joi.string().optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  chronicConditions: Joi.array().items(Joi.string()).optional(),

  emergencyContact: Joi.object({
    name: Joi.string().optional(),
    phone: Joi.string().optional(),
    relation: Joi.string().optional(),
  }).optional(),

  insurance: Joi.object({
    provider: Joi.string().allow(null, "").optional(),
    policyNumber: Joi.string().allow(null, "").optional(),
    expiryDate: Joi.date().allow(null).optional(),
    isActive: Joi.boolean().optional(),
  }).optional(),

  unit: Joi.string().required(),
});


/**
 * ===============================
 * UPDATE PATIENT VALIDATOR
 * ===============================
 */
const updatePatientValidator = Joi.object({
  hospitalId: Joi.forbidden(), // immutable

  firstName: Joi.string().trim().min(2).max(50),
  lastName: Joi.string().trim().min(2).max(50),

  gender: Joi.string().valid("male", "female", "other"),

  dateOfBirth: Joi.date(),

  phone: Joi.string().trim(),
  email: Joi.string().email(),
  address: Joi.string().trim(),

  nationality: Joi.string().allow(null, ""),

  maritalStatus: Joi.string().valid(
    "single",
    "married",
    "divorced",
    "widow",
    "widower",
    "cohabiting"
  ).allow(null),

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
  ),

  bloodGroup: Joi.string(),
  allergies: Joi.array().items(Joi.string()),
  chronicConditions: Joi.array().items(Joi.string()),

  emergencyContact: Joi.object({
    name: Joi.string(),
    phone: Joi.string(),
    relation: Joi.string(),
  }),

  insurance: Joi.object({
    provider: Joi.string().allow(null, ""),
    policyNumber: Joi.string().allow(null, ""),
    expiryDate: Joi.date().allow(null),
    isActive: Joi.boolean(),
  }),

  unit: Joi.string(),
})
.min(1); // At least one field must be provided


module.exports = {
  createPatientValidator,
  updatePatientValidator,
};