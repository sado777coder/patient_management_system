const mongoose = require("mongoose");

const abortionSchema = new mongoose.Schema(
  {
    hospital: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Hospital",
  required: true,
  index: true
},
    pregnancy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pregnancy",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
    },

    type: {
      type: String,
      enum: ["spontaneous", "induced"],
      required: true,
    },

    gestationalAgeWeeks: {
      type: Number,
      min: 0,
    },

    complications: {
      type: String,
    },

    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

abortionSchema.pre("save", function () {
  if (!this.hospital && this._reqUserHospital) {
    this.hospital = this._reqUserHospital;
  }
});

module.exports = mongoose.model("Abortion", abortionSchema);