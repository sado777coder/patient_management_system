const Medication = require("../models/Medication");

/**
 * CREATE MEDICATION
 */
const createMedication = async (req, res, next) => {
  try {
    const { name, form, strength, category } = req.body;

    const medication = await Medication.create({
      name,
      form,
      strength,
      category,
      hospital: req.user.hospital,
    });

    res.status(201).json({
      success: true,
      message: "Medication created successfully",
      data: medication,
    });
  } catch (error) {
   next (error);
  }
};

/**
 * GET ALL MEDICATIONS WITH PAGINATION
 */
const getMedications = async (req, res, next) => {
  try {
    // Read pagination query params with defaults
    const page = parseInt(req.query.page) || 1; // default page 1
    const limit = parseInt(req.query.limit) || 20; // default 20 meds per page
    const skip = (page - 1) * limit;

    // Optional search by name
    const search = req.query.search
      ? { name: { $regex: req.query.search, $options: "i" } }
      : {};

    // Query medications for the current hospital with pagination
    const medications = await Medication.find({
      hospital: req.user.hospital,
      ...search,
    })
      .sort({ name: 1 }) // optional alphabetical sort
      .skip(skip)
      .limit(limit);

    // Get total count for pagination info
    const total = await Medication.countDocuments({
      hospital: req.user.hospital,
      ...search,
    });

    res.json({
      success: true,
      data: medications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET SINGLE MEDICATION
 */
const getMedication = async (req, res,next) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      hospital: req.user.hospital,
    });

    if (!medication) {
      return res.status(404).json({ success: false, message: "Medication not found" });
    }

    res.json({ success: true, data: medication });
  } catch (error) {
    next (error);
  }
};

/**
 * UPDATE MEDICATION
 */
const updateMedication = async (req, res, next) => {
  try {
    const medication = await Medication.findOneAndUpdate(
      { _id: req.params.id, hospital: req.user.hospital },
      req.body,
      { new: true }
    );

    if (!medication) {
      return res.status(404).json({ success: false, message: "Medication not found" });
    }

    res.json({ success: true, message: "Medication updated", data: medication });
  } catch (error) {
    next (error);
  }
};

/**
 * DELETE MEDICATION
 */
const deleteMedication = async (req, res, next) => {
  try {
    const medication = await Medication.findOneAndDelete({
      _id: req.params.id,
      hospital: req.user.hospital,
    });

    if (!medication) {
      return res.status(404).json({ success: false, message: "Medication not found" });
    }

    res.json({ success: true, message: "Medication deleted" });
  } catch (error) {
    next (error);
  }
};

module.exports = {
  createMedication,
  getMedications,
  getMedication,
  updateMedication,
  deleteMedication,
};