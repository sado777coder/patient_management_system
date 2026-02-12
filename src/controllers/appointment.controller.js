const AppointmentModel = require("../models/Appointment");

/**
 * CREATE
 */
const createAppointment = async (req, res, next) => {
  try {
    const appointment = await AppointmentModel.create(req.body);

    res.status(201).json({
      success: true,
      message: "Appointment created",
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ALL (pagination + filters)
 */
const getAppointments = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { patient, doctor, status, fromDate, toDate } = req.query;

    const filter = {};

    if (patient) filter.patient = patient;
    if (doctor) filter.doctor = doctor;
    if (status) filter.status = status;

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }

    const total = await AppointmentModel.countDocuments(filter);

    const appointments = await AppointmentModel.find(filter)
      .populate("patient doctor", "firstName lastName name email")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: appointments,
    });
  } catch (err) {
    next(err);
  }
};


 // GET ONE
 
const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await AppointmentModel.findById(req.params.id)
      .populate("patient doctor");

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    res.status(200).json({ 
      success: true,
      data: appointment });
  } catch (err) {
    next(err);
  }
};


 // UPDATE
 
const updateAppointment = async (req, res, next) => {
  try {
    const appointment = await AppointmentModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    res.status(200).json({ 
      success: true,
      message: "Updated", 
      data: appointment });
  } catch (err) {
    next(err);
  }
};


 // DELETE
 
const deleteAppointment = async (req, res, next) => {
  try {
    await AppointmentModel.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
       message: "Deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
};