const bcrypt = require("bcrypt");
const UserModel = require("../models/User");
const HospitalModel = require("../models/Hospital");
const { generateToken } = require("../utils/bcrypt");

const SALT_ROUNDS = 10;

/**
 * NORMALIZE EMAIL (central safe helper)
 */
const normalizeEmail = (email) => email?.trim().toLowerCase();

/**
 * REGISTER STAFF
 */
const registerUser = async (req, res, next) => {
  try {
    let { name, email, password, role, hospital } = req.body;

    email = normalizeEmail(email);

    const existing = await UserModel.findOne({
      email,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });

    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    // SUPER ADMIN RULES
    if (req.user.role === "super_admin") {
      if (role !== "admin") {
        return res.status(403).json({
          message: "SUPER_ADMIN can only create hospital admins",
        });
      }

      if (!hospital) {
        const hospitals = await HospitalModel.find({ isActive: true });

        if (hospitals.length === 1) {
          hospital = hospitals[0]._id;
        } else {
          return res.status(400).json({
            message: "Please specify a hospital",
          });
        }
      }
    }

    // ADMIN RULES
    if (req.user.role === "admin") {
      const allowedRoles = [
        "record_officer",
        "doctor",
        "physician_assistant",
        "nurse",
        "pharmacist",
        "midwife",
        "lab_technician",
        "revenue_officer",
      ];

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          message: "Admin cannot create this role",
        });
      }

      hospital = req.user.hospital;
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await UserModel.create({
      name,
      email,
      password: hash,
      role,
      hospital,
      mustChangePassword: true,

      // 🔥 CRITICAL FIX (CONSISTENCY)
      isDeleted: false,
      isActive: true,
    });

    res.status(201).json({
      message: "User created successfully",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * LOGIN
 */
const loginUser = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    console.log("LOGIN EMAIL:", email);

    const user = await UserModel.findOne({
      email,

      // 🔥 FIX: handles missing field + false properly
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    }).populate("hospital", "name");

    console.log("FOUND USER:", user?.email);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (user.isActive === false)
      return res.status(403).json({ message: "Account disabled" });

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user);

    return res.status(200).json({
      message: "Logged in",
      token,
      mustChangePassword: user.mustChangePassword,
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * CHANGE PASSWORD
 */
const changePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const user = await UserModel.findById(req.user._id);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.mustChangePassword = false;

    await user.save();

    const token = generateToken(user);

    res.status(200).json({
      message: "Password changed successfully",
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET PROFILE
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user._id)
      .select("-password")
      .populate("hospital", "name");

    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * GET USERS
 */
const getUsers = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      ...req.query,
      isDeleted: { $ne: true }, // 🔥 FIX: catches false, null, undefined
    };

    if (req.user.role !== "super_admin") {
      query.hospital = req.user.hospital;
    }

    const total = await UserModel.countDocuments(query);

    const users = await UserModel.find(query)
      .select("-password")
      .populate("hospital", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET USER BY ID
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await UserModel.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    })
      .select("-password")
      .populate("hospital", "name");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE USER
 */
const updateUser = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
    }

    delete updates.role;

    const user = await UserModel.findOneAndUpdate(
      {
        _id: req.params.id,
        isDeleted: { $ne: true },
      },
      updates,
      { new: true }
    )
      .select("-password")
      .populate("hospital", "name");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Updated", data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * CHANGE ROLE
 */
const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    const user = await UserModel.findOneAndUpdate(
      {
        _id: req.params.id,
        isDeleted: { $ne: true },
      },
      { role },
      { new: true }
    ).select("-password");

    res.status(200).json({
      message: "Role updated",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * TOGGLE STATUS
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      message: "Status updated",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE USER
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    user.isDeleted = true;
    user.isActive = false;

    await user.save();

    res.status(200).json({
      message: "User deleted",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  loginUser,
  changePassword,
  getProfile,
  getUsers,
  getUserById,
  updateUser,
  changeUserRole,
  toggleUserStatus,
  deleteUser,
};