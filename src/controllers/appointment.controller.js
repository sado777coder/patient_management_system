const AppointmentModel = require("../models/Appointment");
const mongoose = require("mongoose");

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
    const hospital = req.user.hospital;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const { patient, doctor, status, fromDate, toDate, q } = req.query;

    let filter = { hospital };

    // FILTERS
    if (patient) filter.patient = patient;
    if (doctor) filter.doctor = doctor;
    if (status) filter.status = status;

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }

    // BASE QUERY
    let query = AppointmentModel.find(filter)
      .populate("patient", "firstName lastName")
      .populate("doctor", "name email")
      .sort({ date: -1 });

    if (q) {
      const regex = new RegExp(q, "i");

      query = query.find({
        $or: [
          { reason: regex },
        ],
      });
    }

    const [appointments, total] = await Promise.all([
      query.skip(skip).limit(limit).lean(),
      AppointmentModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Appointments fetched",
      data: appointments,

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
 * GET ONE
 */
const getAppointmentById = async (req, res, next) => {
  try {
    const hospital = req.user.hospital;

    const appointment = await AppointmentModel.findOne({
      _id: req.params.id,
      hospital,
    })
      .populate("patient doctor")
      .lean();

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE
 */
const updateAppointment = async (req, res, next) => {
  try {
    const hospital = req.user.hospital;

    const appointment = await AppointmentModel.findOneAndUpdate(
      { _id: req.params.id, hospital },
      req.body,
      { new: true, runValidators: true }
    ).lean();

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Updated successfully",
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
};

const searchAppointments = async (req, res, next) => {
  try {
    const keyword = req.query.q?.trim();

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Search query required",
      });
    }

    const matchConditions = [
      { reason: { $regex: keyword, $options: "i" } },
      { status: { $regex: keyword, $options: "i" } },
      { "patient.firstName": { $regex: keyword, $options: "i" } },
      { "patient.lastName": { $regex: keyword, $options: "i" } },
      { "doctor.name": { $regex: keyword, $options: "i" } },
      { "patient.registrationNumber": { $regex: keyword, $options: "i" } },
    ];

    // Allow searching by ID
    if (mongoose.Types.ObjectId.isValid(keyword)) {
      matchConditions.push({ _id: new mongoose.Types.ObjectId(keyword) });
    }

    const results = await AppointmentModel.aggregate([
      {
        $match: {
          hospital: new mongoose.Types.ObjectId(req.user.hospital),
        },
      },

      // JOIN PATIENT
      {
        $lookup: {
          from: "patients",
          localField: "patient",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: "$patient" },

      // JOIN DOCTOR (USER)
      {
        $lookup: {
          from: "users",
          localField: "doctor",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: "$doctor" },

      // SEARCH
      {
        $match: {
          $or: matchConditions,
        },
      },

      // CLEAN RESPONSE
      {
        $project: {
          date: 1,
          status: 1,
          reason: 1,
          createdAt: 1,

          patient: {
            _id: "$patient._id",
            firstName: "$patient.firstName",
            lastName: "$patient.lastName",
          },

          doctor: {
            _id: "$doctor._id",
            name: "$doctor.name",
            email: "$doctor.email",
          },
        },
      },

      { $sort: { date: -1 } },
    ]);

    res.status(200).json({
      success: true,
      message: "Appointments search results",
      data: results,
    });

  } catch (err) {
    next(err);
  }
};

/**
 * DELETE
 */
const deleteAppointment = async (req, res, next) => {
  try {
    const hospital = req.user.hospital;

    const appointment = await AppointmentModel.findOneAndDelete({
      _id: req.params.id,
      hospital,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

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
  searchAppointments,
  deleteAppointment,
};