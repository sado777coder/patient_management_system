const bcrypt = require("bcrypt");
const UserModel = require("../models/User");
const { generateToken } = require("../utils/bcrypt");

const SALT_ROUNDS = 10;

/**
 * REGISTER STAFF (admin only should call this route)
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await UserModel.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await UserModel.create({
      name,
      email,
      password: hash,
      role,
    });

    res.status(201).json({
      message: "User created successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
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
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (!user.isActive)
      return res.status(403).json({ message: "Account disabled" });

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user);

    res.status(200).json({
      message: "Logged in",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};


/**
 * GET MY PROFILE
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user._id).select("-password");

    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
};


/**
 * GET ALL USERS (admin only)
 */
const getUsers = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { role, isActive } = req.query;

    const filter = {};

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const total = await UserModel.countDocuments(filter);

    const users = await UserModel.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

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
 * GET SINGLE USER
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id).select("-password");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
};


/**
 * UPDATE PROFILE (self or admin)
 */
const updateUser = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
    }

    const user = await UserModel.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      message: "Updated successfully",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * CHANGE ROLE (admin only)
 */
const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    const user = await UserModel.findByIdAndUpdate(
      req.params.id,
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
 * ACTIVATE / DEACTIVATE USER
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      message: `User ${user.isActive ? "activated" : "deactivated"}`,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * DELETE USER (admin only)
 */
const deleteUser = async (req, res, next) => {
  try {
    await UserModel.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    next(err);
  }
};


module.exports = {
  registerUser,
  loginUser,
  getProfile,
  getUsers,
  getUserById,
  updateUser,
  changeUserRole,
  toggleUserStatus,
  deleteUser,
};