const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    hospital: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Hospital",
  default:null,
  index: true
},
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, index: true },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: [
        "super_admin",
        "admin",
        "record_officer", 
        "doctor",
        "physician_assistant",
        "nurse",
        "pharmacist",
        "midwife",    
        "lab_technician",  
        "revenue_officer"  
      ],
      default: "nurse",
    },

    mustChangePassword: {
    type: Boolean,
    default: false,
  },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);