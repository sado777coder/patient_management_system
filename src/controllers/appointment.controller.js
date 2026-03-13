const AppointmentModel = require("../models/Appointment");

/**
 * CREATE
 */
const createAppointment = async (req, res, next) => {
  try {
    const hospital = req.user.hospital;

    const appointment = await AppointmentModel.create({
      ...req.body,
      hospital,
    });

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
    const hospitalId = req.user.hospital;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { patient, doctor, status, fromDate, toDate } = req.query;

    const filter = { hospital: req.user.hospital };

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
    const hospitalId = req.user.hospitalId;

    const appointment = await AppointmentModel.findOne({
      _id: req.params.id,
      hospital,
    }).populate("patient doctor");

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
};;


 // UPDATE
 
const updateAppointment = async (req, res, next) => {
  try {
    const hospitalId = req.user.hospitalId;

    const appointment = await AppointmentModel.findOneAndUpdate(
      { _id: req.params.id, hospital},
      req.body,
      { new: true, runValidators: true }
    );

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    res.status(200).json({
      success: true,
      message: "Updated",
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
};


 // DELETE
 
const deleteAppointment = async (req, res, next) => {
  try {
    const hospitalId = req.user.hospitalId;

    const appointment = await AppointmentModel.findOneAndDelete({
      _id: req.params.id,
      hospital,
    });

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
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