const PatientModel = require("../models/Patient");

/**
 * CREATE
 */
const createPatient = async (req, res, next) => {
  try {
     const patient = await PatientModel.create(req.body);

    res.status(201).json({
      success:true,
       message: "Patient created", 
       data: patient });
  } catch (err) {
    next(err);
  }
};

// GET ALL
const getPatients = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };

    const total = await PatientModel.countDocuments(filter);

    const patients = await PatientModel.find(filter)
     .populate("unit", "name code")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success:true,
       total, 
       page, 
       data: patients });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ONE
 */
const getPatientById = async (req, res, next) => {
  try {
    const patient = await PatientModel.findById(req.params.id)
     .populate("unit", "name code");

    if (!patient || patient.isDeleted)
      return res.status(404).json({ message: "Not found" });

    res.status(200).json({
      success:true,
      message:"The patient is:",
       data: patient });
  } catch (err) {
    next(err);
  }
};

//UPDATE
const updatePatient = async (req, res, next) => {
  try {
    // protect ID
    delete req.body.hospitalId;

    // prevent editing archived patients
    const patient = await PatientModel.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true }
    ).populate("unit", "name code");

    if (!patient)
      return res.status(404).json({ message: "Patient not found" });

    res.status(200).json({ 
      success:true,
      message:"Updated client",
      data: patient });
  } catch (err) {
    next(err);
  }
};

 //SOFT DELETE
const deletePatient = async (req, res, next) => {
  try {
    await PatientModel.findByIdAndUpdate(req.params.id, { isDeleted: true });

    res.status(200).json({ message: "Patient archived" });
  } catch (err) {
    next(err);
  }
};

/**
 * SEARCH PATIENT (FAST — text index)
 * by hospitalId | name | phone
 */
const searchPatients = async (req, res, next) => {
  try {
    const keyword = req.query.q?.trim();

    if (!keyword)
      return res.status(400).json({ message: "Search query required" });

    const patients = await PatientModel.find({
      isDeleted: false,
       $or: [
    { hospitalId: keyword }, // exact match (super fast)
    { $text: { $search: keyword } }
  ],
    })
      .select({ score: { $meta: "textScore" } }) // relevance score
      .sort({ score: { $meta: "textScore" } })   // best matches first
      .limit(20);

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  searchPatients
};