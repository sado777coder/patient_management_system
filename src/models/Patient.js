const mongoose = require("mongoose");
const generateHospitalId = require("../services/hospitalId.service");

const patientSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: String,
      unique: true,
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
      enum: ["single","married","divorced","widow","widower","cohabiting"],
      default: null,
    },

    occupation: {
      type: String,
      enum: [
        "farmer","tailor","seamstress","student","teacher","fisher",
        "health_provider","trader","driver","civil_servant","unemployed","other"
      ],
      default: "other",
    },

    bloodGroup: String,
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

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
 { timestamps: true}
);


// Indexes
patientSchema.index({ hospitalId: 1, isDeleted: 1 });
patientSchema.index({ phone: 1, isDeleted: 1 });
patientSchema.index({ firstName: 1, lastName: 1, isDeleted: 1 });

patientSchema.index({
  firstName: "text",
  lastName: "text",
  phone: "text",
});


// Hooks
patientSchema.pre("save", async function () {
  if (!this.hospitalId) {
    this.hospitalId = await generateHospitalId();
  }
});


// Methods
patientSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};


module.exports = mongoose.model("Patient", patientSchema);