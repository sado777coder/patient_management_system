const mongoose = require("mongoose");
const generateHospitalId = require("../services/hospitalId.service");

const patientSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: String,
      immutable: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    dateOfBirth: Date,
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    nationality: { type: String, trim: true, default: null },
    maritalStatus: {
      type: String,
      enum: ["single", "married", "divorced", "widow", "widower", "cohabiting"],
      default: null,
    },
    occupation: {
      type: String,
      enum: [
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
        "other",
      ],
      default: "other",
    },
    bloodGroup: { type: String, index: true },
    allergies: [String],
    chronicConditions: [String],
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    insurance: {
      provider: { type: String, default: null },
      policyNumber: { type: String, default: null },
      expiryDate: { type: Date, default: null },
      isActive: { type: Boolean, default: false },
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

//
// ================= INDEXES =================
//
patientSchema.index({ hospitalId: 1 }, { unique: true });
patientSchema.index({ isDeleted: 1, unit: 1, createdAt: -1 });
patientSchema.index({ firstName: 1, lastName: 1 });
patientSchema.index({
  firstName: "text",
  lastName: "text",
  phone: "text",
});

//
// ================= VIRTUALS =================
//
patientSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const diff = Date.now() - this.dateOfBirth.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

//
// ================= GLOBAL SOFT DELETE FILTER =================
//
patientSchema.pre(/^find/, async function () {
  if (!this.getQuery().includeDeleted) {
    this.where({ isDeleted: false });
  }
});

//
// ================= SAFE HOSPITAL ID GENERATION =================
//
patientSchema.pre("save", async function () {
  if (this.hospitalId) return;

  let unique = false;
  while (!unique) {
    const id = await generateHospitalId();
    const existing = await mongoose.models.Patient.exists({ hospitalId: id });
    if (!existing) {
      this.hospitalId = id;
      unique = true;
    }
  }
});

//
// ================= METHODS =================
//
patientSchema.methods.softDelete = function (userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.updatedBy = userId;
  return this.save();
};

module.exports = mongoose.model("Patient", patientSchema);