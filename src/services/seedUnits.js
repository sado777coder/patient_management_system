const Unit = require("../models/Unit");

const unitSeeds = async (hospitalId) => {
  try {
    const defaults = [
      { name: "Outpatient Department", code: "OPD" },
      { name: "Dental", code: "DEN" },
      { name: "Eye Clinic", code: "EYE" },
      { name: "Maternity", code: "MAT" },
    ];

    for (const unit of defaults) {
      //  Check if it already exists (including deleted ones)
      const existing = await Unit.findOne({
        code: unit.code,
        hospital: hospitalId,
      });

      if (!existing) {
        // Create only if not exists
        await Unit.create({
          ...unit,
          hospital: hospitalId,
          isActive: true,
          isDeleted: false,
        });
      } else if (existing.isDeleted) {
        // ♻️ Restore if it was soft-deleted
        existing.isDeleted = false;
        existing.isActive = true;
        existing.name = unit.name; // optional sync
        await existing.save();
      }
      // else → already exists and active → do nothing 
    }

    console.log("✅ Default units seeded safely");
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
  }
};

module.exports = unitSeeds;