const HospitalModel = require("../models/Hospital");

/**
 * GET LOGGED-IN USER'S HOSPITAL
 * GET /hospital
 */
const getMyHospital = async (req, res, next) => {
  try {
    const hospital = await HospitalModel.findById(req.user.hospital);

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
 * UPDATE LOGGED-IN USER'S HOSPITAL
 * PUT /hospital
 */
const updateMyHospital = async (req, res, next) => {
  try {
    //  Only allow specific fields to be updated
    const allowedFields = ["name", "address", "phone", "email"];

    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // If nothing valid was sent
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const hospital = await HospitalModel.findByIdAndUpdate(
      req.user.hospital,
      updates,
      { new: true, runValidators: true }
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
    next(err);
  }
};

module.exports = {
  getMyHospital,
  updateMyHospital,
};