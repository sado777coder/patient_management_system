const bcrypt = require("bcrypt");
const UserModel = require("../models/User");
const HospitalModel = require("../models/Hospital");
const { generateToken } = require("../utils/bcrypt");

const SALT_ROUNDS = 10;

/**
 * NORMALIZE EMAIL
 */
const normalizeEmail = (email) => email?.trim().toLowerCase();

/**
 * REGISTER STAFF
 *
 * POST /api/users
 *
 * SUPER_ADMIN:
 *   - Can create hospital admins for existing hospitals.
 *
 * HOSPITAL ADMIN:
 *   - Can create staff for their own hospital only.
 *   - Hospital is ALWAYS taken from req.user.hospital.
 */
const registerUser = async (req, res, next) => {
  try {
    let {
      name,
      email,
      password,
      role,
      hospital,
    } = req.body;

    email = normalizeEmail(email);

    // -----------------------------------------
    // Check duplicate email
    // -----------------------------------------
    const existing = await UserModel.findOne({
      email,
      isDeleted: { $ne: true },
    });

    if (existing) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    // -----------------------------------------
    // SUPER_ADMIN
    // -----------------------------------------
    if (req.user.role === "super_admin") {
      // SUPER_ADMIN can only create hospital admins
      if (role !== "admin") {
        return res.status(403).json({
          message: "SUPER_ADMIN can only create hospital admins",
        });
      }

      if (!hospital) {
        return res.status(400).json({
          message: "Hospital is required",
        });
      }

      // Make sure the selected hospital exists
      const selectedHospital = await HospitalModel.findOne({
        _id: hospital,
        isActive: true,
      });

      if (!selectedHospital) {
        return res.status(404).json({
          message: "Active hospital not found",
        });
      }
    }

    // -----------------------------------------
    // HOSPITAL ADMIN
    // -----------------------------------------
    else if (req.user.role === "admin") {
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

      // VERY IMPORTANT:
      // Ignore any hospital sent by frontend.
      // Always use the logged-in admin's hospital.
      hospital = req.user.hospital;

      if (!hospital) {
        return res.status(403).json({
          message: "Admin is not assigned to a hospital",
        });
      }
    }

    // -----------------------------------------
    // Other roles cannot create users
    // -----------------------------------------
    else {
      return res.status(403).json({
        message: "You are not allowed to create users",
      });
    }

    // -----------------------------------------
    // Hash password
    // -----------------------------------------
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    // -----------------------------------------
    // Create user
    // -----------------------------------------
    const user = await UserModel.create({
      name,
      email,
      password: hash,
      role,
      hospital,

      mustChangePassword: true,
      isDeleted: false,
      isActive: true,
    });

    // Never return password
    const safeUser = await UserModel.findById(user._id)
      .select("-password")
      .populate("hospital", "name code");

    res.status(201).json({
      message: "User created successfully",
      data: safeUser,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "A user with this email already exists",
      });
    }

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

    const user = await UserModel.findOne({
      email,
      isDeleted: { $ne: true },
    }).populate("hospital", "name code isActive");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: "Account disabled",
      });
    }

    // Every non-SUPER_ADMIN must belong to a hospital
    if (user.role !== "super_admin") {
      if (!user.hospital) {
        return res.status(403).json({
          message: "User is not assigned to a hospital",
        });
      }

      if (user.hospital.isActive === false) {
        return res.status(403).json({
          message: "Hospital account suspended",
        });
      }
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user);

    // Never send the password hash to the browser
    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(200).json({
      message: "Logged in",
      token,
      mustChangePassword: user.mustChangePassword,
      user: safeUser,
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

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.password = await bcrypt.hash(
      newPassword,
      SALT_ROUNDS
    );

    user.mustChangePassword = false;

    await user.save();

    const token = generateToken(user);

    // Never send the password hash to the browser
    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(200).json({
      message: "Password changed successfully",
      token,
      mustChangePassword: user.mustChangePassword,
      user: safeUser,
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
      .populate("hospital", "name code isActive");

    res.status(200).json({
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET USERS
 */
const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const query = {
      isDeleted: { $ne: true },
    };

    // SUPER_ADMIN can view users across hospitals.
    if (req.user.role !== "super_admin") {
      query.hospital = req.user.hospital;
    }

    const total = await UserModel.countDocuments(query);

    const users = await UserModel.find(query)
      .select("-password")
      .populate("hospital", "name code")
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
    const query = {
      _id: req.params.id,
      isDeleted: { $ne: true },
    };

    // Tenant users can only access users
    // belonging to their own hospital.
    if (req.user.role !== "super_admin") {
      query.hospital = req.user.hospital;
    }

    const user = await UserModel.findOne(query)
      .select("-password")
      .populate("hospital", "name code");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE USER
 */
const updateUser = async (req, res, next) => {
  try {
    const updates = {
      ...req.body,
    };

    // Never allow these fields to be changed here.
    delete updates.role;
    delete updates.hospital;
    delete updates.isDeleted;

    if (updates.password) {
      if (updates.password.length < 8) {
        return res.status(400).json({
          message: "Password must be at least 8 characters",
        });
      }

      updates.password = await bcrypt.hash(
        updates.password,
        SALT_ROUNDS
      );

      updates.mustChangePassword = true;
    }

    const query = {
      _id: req.params.id,
      isDeleted: { $ne: true },
    };

    // Tenant admin can only update users
    // in their own hospital.
    if (req.user.role !== "super_admin") {
      query.hospital = req.user.hospital;
    }

    const user = await UserModel.findOneAndUpdate(
      query,
      updates,
      {
        new: true,
        runValidators: true,
      }
    )
      .select("-password")
      .populate("hospital", "name code");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "Updated",
      data: user,
    });
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
      return res.status(400).json({
        message: "Invalid staff role",
      });
    }

    const query = {
      _id: req.params.id,
      isDeleted: { $ne: true },
    };

    if (req.user.role !== "super_admin") {
      query.hospital = req.user.hospital;
    }

    const user = await UserModel.findOneAndUpdate(
      query,
      { role },
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("hospital", "name code");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

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
    const query = {
      _id: req.params.id,
      isDeleted: { $ne: true },
    };

    if (req.user.role !== "super_admin") {
      query.hospital = req.user.hospital;
    }

    const user = await UserModel.findOne(query);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.isActive = !user.isActive;

    await user.save();

    const safeUser = await UserModel.findById(user._id)
      .select("-password")
      .populate("hospital", "name code");

    res.status(200).json({
      message: "Status updated",
      data: safeUser,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE USER
 *
 * Soft delete only.
 */
const deleteUser = async (req, res, next) => {
  try {
    const query = {
      _id: req.params.id,
      isDeleted: { $ne: true },
    };

    if (req.user.role !== "super_admin") {
      query.hospital = req.user.hospital;
    }

    const user = await UserModel.findOne(query);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Prevent accidentally deleting SUPER_ADMIN
    if (user.role === "super_admin") {
      return res.status(403).json({
        message: "SUPER_ADMIN cannot be deleted",
      });
    }

    user.isDeleted = true;
    user.isActive = false;

    await user.save();

    const safeUser = await UserModel.findById(user._id)
      .select("-password")
      .populate("hospital", "name code");

    res.status(200).json({
      message: "User deleted",
      data: safeUser,
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