const cron = require("node-cron");
const Patient = require("../models/Patient");

console.log("Insurance expiry cron registered...");

cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Running insurance expiry check...");

    const result = await Patient.updateMany(
      { "insurance.expiryDate": { $lt: new Date() } },
      { $set: { "insurance.isActive": false } }
    );

    console.log(`Updated ${result.modifiedCount} expired insurances`);
  } catch (err) {
    console.error("Insurance cron failed:", err.message);
  }
});