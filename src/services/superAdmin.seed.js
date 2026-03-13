require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);

    const existing = await User.findOne({ email: "owner@system.com" });

    if (existing) {
      console.log(" [Seeder], SUPER_ADMIN already exists--skipping");
      return;
    }

    const hashedPassword = await bcrypt.hash("ChangeMe123!", 10);

    await User.create({
      name: "System owner",
      email: "owner@system.com",
      password: hashedPassword,
      role: "super_admin",
      hospital: null,
      mustChangePassword: true,
    });

    console.log("SUPER_ADMIN seeded successfully");
  } catch (err) {
    console.error("Error seeding SUPER_ADMIN:", err);
  }
};

module.exports = seedSuperAdmin;