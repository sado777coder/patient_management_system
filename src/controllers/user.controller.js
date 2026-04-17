const bcrypt = require("bcrypt");
const UserModel = require("../models/User");
const HospitalModel = require("../models/Hospital");
const { generateToken } = require("../utils/bcrypt");

const SALT_ROUNDS = 10;

/**
 * REGISTER STAFF
 */
const registerUser = async (req, res, next) => {
  try {
    let { name, email, password, role, hospital } = req.body;
    email = email.toLowerCase();

    const existing = await UserModel.findOne({ email, isDeleted: false });

    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    /**
     * ROLE SECURITY RULES
     */

    // SUPER ADMIN
    if (req.user.role === "super_admin") {
      if (role !== "admin") {
        return res.status(403).json({
          message: "SUPER_ADMIN can only create hospital admins",
        });
      }

      // Auto assign hospital if only one exists
      if (!hospital) {
        const hospitals = await HospitalModel.find({ isActive: true });

        if (hospitals.length === 1) {
          hospital = hospitals[0]._id;
        } else {
          return res.status(400).json({
            message:
              "Please specify a hospital when creating an admin (multiple hospitals exist)",
          });
        }
      }
    }

    // ADMIN
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

      // Force hospital
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
    });

    res.status(201).json({
      message: "User created successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospital,
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
    let { email, password } = req.body;
    email = email.toLowerCase();
    console.log("LOGIN EMAIL:", email);

    const user = await UserModel.findOne({ email: email.toLowerCase() })
    .populate("hospital", "name");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (!user.isActive)
      return res.status(403).json({ message: "Account disabled" });

    const match = await bcrypt.compare(password, user.password);
    console.log("PASSWORD MATCH:", match);

    if (!match)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user);

    if (user.mustChangePassword) {
      return res.status(200).json({
        message: "Password change required",
        mustChangePassword: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          hospital: user.hospital,
        },
      });
    }

    res.status(200).json({
      message: "Logged in",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospital: user.hospital,
      },
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
    console.log("CHANGE PASSWORD USER:", req.user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    user.password = hashedPassword;
    user.mustChangePassword = false;

    await user.save();
    
    const token = generateToken(user);
    res.status(200).json({
  message: "Password changed successfully",
  token, 
  user: {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    hospital: user.hospital,
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
    const user = await UserModel.findById(req.user._id)
      .select("-password")
      .populate("hospital", "name");

    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ALL USERS
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

    let query = { ...filter, isDeleted: false };

    if (req.user.role !== "super_admin") {
      query.hospital = req.user.hospital;
    }

    const total = await UserModel.countDocuments(query);

    const users = await UserModel.find(query)
      .select("-password")
      .populate("hospital", "name")
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
    const query = {
      _id: req.params.id,
      isDeleted: false,
    };

    if (req.user.role !== "super_admin") {
      query.hospital = req.user.hospital;
    }

    const user = await UserModel.findOne(query)
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

    if (updates.role) {
      delete updates.role;
    }

    const query = {
      _id: req.params.id,
      isDeleted: false,
    };

    if (req.user.role !== "super_admin") {
      query.hospital = req.user.hospital;
    }

    const user = await UserModel.findOneAndUpdate(query, updates, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .populate("hospital", "name");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      message: "Updated successfully",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * CHANGE USER ROLE
 */
const changeUserRole = async (req, res, next) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        message: "You cannot change your own role",
      });
    }

    const { role } = req.body;

    const query = { _id: req.params.id };

    if (req.user.role !== "super_admin") {
      query.hospital = req.user.hospital;
    }

    const user = await UserModel.findOneAndUpdate(
      query,
      { role },
      { new: true }
    )
      .select("-password")
      .populate("hospital", "name");

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
    const query = {
      _id: req.params.id,
      isDeleted: false,
    };

    if (req.user.role !== "super_admin") {
      query.hospital = req.user.hospital;
    }

    const user = await UserModel.findOne(query);

    if (!user)
      return res.status(404).json({ message: "User not found" });

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
 * DELETE USER (SOFT DELETE)
 */
const deleteUser = async (req, res, next) => {
  try {
    const query = {
      _id: req.params.id,
      isDeleted: false,
    };

    if (req.user.role !== "super_admin") {
      query.hospital = req.user.hospital;
    }

    const user = await UserModel.findOne(query);

    if (!user)
      return res.status(404).json({
        message: "User not found or already deleted",
      });

    if (user.role === "super_admin") {
      return res.status(403).json({
        message: "Super admin cannot be deleted",
      });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.isActive = false;

    await user.save();

    res.status(200).json({
      message: "User archived successfully",
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