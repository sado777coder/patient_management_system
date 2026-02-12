const bcrypt = require("bcrypt");
const User = require("../models/User");

const seedAdmin = async () => {
  const exists = await User.findOne({ role: "admin" });

  if (exists) {
    console.log("Admin already exists — skipping seed");
    return;
  }

  const password = await bcrypt.hash("password123", 10);

  await User.create({
    name: "System Admin",
    email: "admin@test.com",
    password,
    role: "admin",
  });

  console.log(" Default admin created → admin@test.com / password123");
};

module.exports = seedAdmin;