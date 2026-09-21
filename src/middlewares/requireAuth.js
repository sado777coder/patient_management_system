const userModel = require("../models/User");
const hospitalModel = require("../models/Hospital");
const jwt = require("jsonwebtoken");
const permissions = require("./permissions");

const requireAuth = async (req, res, next) => {
  const authHeader = req.header("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(payload.id || payload.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: "Account is disabled",
      });
    }

    if (
      user.mustChangePassword &&
      !req.originalUrl.includes("change-password")
    ) {
      return res.status(403).json({
        message: "Password change required",
        mustChangePassword: true,
      });
    }

    // Every non-SUPER_ADMIN user must belong to a hospital
    if (user.role !== permissions.SUPER_ADMIN) {
      if (!user.hospital) {
        return res.status(403).json({
          message: "User is not assigned to a hospital",
        });
      }

      const hospital = await hospitalModel.findById(user.hospital);

      if (!hospital || hospital.isActive === false) {
        return res.status(403).json({
          message: "Hospital account suspended",
        });
      }
    }

    req.user = {
      _id: user._id,
      name: user.name,
      role: user.role,
      hospital: user.hospital,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error(error);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = requireAuth;