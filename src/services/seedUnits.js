const Unit = require("../models/Unit");

const unitSeeds = async () => {
  const defaults = [
    { name: "Outpatient Department", code: "OPD" },
    { name: "Dental", code: "DEN" },
    { name: "Eye Clinic", code: "EYE" },
    { name: "Maternity", code: "MAT" }
  ];

  for (const unit of defaults) {
    await Unit.updateOne(
      { code: unit.code },
      unit,
      { upsert: true }
    );
  }

  console.log("Default units seeded");
};

module.exports = unitSeeds;