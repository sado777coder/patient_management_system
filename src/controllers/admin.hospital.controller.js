const HospitalModel = require("../models/Hospital");

/**
 * CREATE HOSPITAL
 * POST /admin/hospitals
 */
const createHospital = async (req, res, next) => {
  try {
    const hospital = await HospitalModel.create(req.body);

    res.status(201).json({
      success: true,
      message: "Hospital created successfully",
      data: hospital,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * GET ALL HOSPITALS (Paginated)
 * GET /admin/hospitals
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
 * GET /admin/hospitals/:id
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
 * PUT /admin/hospitals/:id
 */
const updateHospital = async (req, res, next) => {
  try {
    const hospital = await HospitalModel.findByIdAndUpdate(
      req.params.id,
      req.body,
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


/**
 * DELETE HOSPITAL
 * DELETE /admin/hospitals/:id
 */
const deleteHospital = async (req, res, next) => {
  try {
    const hospital = await HospitalModel.findByIdAndDelete(req.params.id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Hospital deleted successfully",
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