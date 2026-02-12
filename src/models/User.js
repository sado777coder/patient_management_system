const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true, index: true },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: [
    "admin",

    "record_officer", 
    "doctor",
    "physician_assistant",

    "nurse",

    "pharmacist",
    "midwife" ,    
    "lab_technician",  
    "revenue_officer"  
  ],
      default: "nurse",
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);