const mongoose = require("mongoose");

const dispenseSchema = new mongoose.Schema(
  {
    patient: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Patient", 
      required: true,
      index: true
    },

    prescription: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Prescription",
      index: true
    },

    items: [
      {
        medication: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "MedicationStock",
          required: true,
          index: true
        },
        quantity: { 
          type: Number, 
          required: true 
        },
        price: { 
          type: Number, 
          required: true 
        },
      },
    ],

    totalAmount:{ 
      type:Number,
      required:true
    },

    dispensedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      index: true
    },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

dispenseSchema.index({ isDeleted: 1, createdAt: -1 });

module.exports = mongoose.model("Dispense", dispenseSchema);