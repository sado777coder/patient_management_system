const bcrypt = require("bcrypt");

const HospitalModel = require("../models/Hospital");
const UserModel = require("../models/User");

const SALT_ROUNDS = 10;

/**
 * CREATE HOSPITAL + FIRST ADMIN
 *
 * POST /api/admin/hospitals
 *
 * ONLY SUPER_ADMIN can access this route.
 */
const createHospital = async (req, res, next) => {
  try {
    const {
      name,
      code,
      address,
      phone,
      email,
      admin,
    } = req.body;

    // -----------------------------------------
    // 1. Check hospital code
    // -----------------------------------------
    const existingHospital = await HospitalModel.findOne({
      code: code.toUpperCase(),
    });

    if (existingHospital) {
      return res.status(409).json({
        success: false,
        message: "A hospital with this code already exists",
      });
    }

    // -----------------------------------------
    // 2. Check admin email
    // -----------------------------------------
    const normalizedAdminEmail = admin.email.trim().toLowerCase();

    const existingUser = await UserModel.findOne({
      email: normalizedAdminEmail,
      isDeleted: { $ne: true },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    // -----------------------------------------
    // 3. Create hospital
    // -----------------------------------------
    const hospital = await HospitalModel.create({
      name,
      code: code.toUpperCase(),
      address,
      phone,
      email,
      isActive: true,
    });

    try {
      // -----------------------------------------
      // 4. Hash first admin password
      // -----------------------------------------
      const hashedPassword = await bcrypt.hash(
        admin.password,
        SALT_ROUNDS
      );

      // -----------------------------------------
      // 5. Create hospital admin
      // -----------------------------------------
      const hospitalAdmin = await UserModel.create({
        name: admin.name,
        email: normalizedAdminEmail,
        password: hashedPassword,

        role: "admin",

        // IMPORTANT:
        // Connect admin to the hospital just created
        hospital: hospital._id,

        mustChangePassword: true,
        isActive: true,
        isDeleted: false,
      });

      // -----------------------------------------
      // 6. Return result
      // -----------------------------------------
      return res.status(201).json({
        success: true,
        message: "Hospital and hospital admin created successfully",

        data: {
          hospital,

          admin: {
            _id: hospitalAdmin._id,
            name: hospitalAdmin.name,
            email: hospitalAdmin.email,
            role: hospitalAdmin.role,
            hospital: hospitalAdmin.hospital,
            mustChangePassword: hospitalAdmin.mustChangePassword,
            isActive: hospitalAdmin.isActive,
          },
        },
      });
    } catch (userError) {
      // -----------------------------------------
      // Roll back hospital if admin creation fails
      // -----------------------------------------
      await HospitalModel.findByIdAndDelete(hospital._id);

      throw userError;
    }
  } catch (err) {
    // MongoDB duplicate key protection
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Hospital code or user email already exists",
      });
    }

    next(err);
  }
};

/**
 * GET ALL HOSPITALS
 *
 * GET /api/admin/hospitals
 */
const getHospitals = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [hospitals, total] = await Promise.all([
      HospitalModel.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      HospitalModel.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: hospitals,
      meta: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET SINGLE HOSPITAL
 *
 * GET /api/admin/hospitals/:id
 */
const getHospitalById = async (req, res, next) => {
  try {
    const hospital = await HospitalModel.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    res.status(200).json({
      success: true,
      data: hospital,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE HOSPITAL
 *
 * PUT /api/admin/hospitals/:id
 */
const updateHospital = async (req, res, next) => {
  try {
    const hospital = await HospitalModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Hospital updated successfully",
      data: hospital,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Hospital code already exists",
      });
    }

    next(err);
  }
};

/**
 * DELETE /api/admin/hospitals/:id
 *
 * IMPORTANT:
 * We deactivate instead of physically deleting.
 */
const deleteHospital = async (req, res, next) => {
  try {
    const hospital = await HospitalModel.findByIdAndUpdate(
      req.params.id,
      {
        isActive: false,
      },
      {
        new: true,
      }
    );

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Hospital deactivated successfully",
      data: hospital,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createHospital,
  getHospitals,
  getHospitalById,
  updateHospital,
  deleteHospital,
};