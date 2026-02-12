const UnitQueue = require("../models/unitQueue");
const UnitAttendance = require("../models/unitAttendance");
const UnitTransfer = require("../models/unitTransfer");
const Patient = require("../models/Patient");




//ADD PATIENT TO QUEUE + attendance
//POST /queue

const addToQueue = async (req, res, next) => {
  try {
    const { patientId, unitId, priority } = req.body;

    // create queue entry
    const entry = await UnitQueue.create({
      patient: patientId,
      unit: unitId,
      priority: priority || 0,
    });

    // auto increment attendance
    const today = new Date().toISOString().slice(0, 10);

    await UnitAttendance.findOneAndUpdate(
      { unit: unitId, date: today },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: "Patient added to queue",
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

// Find the next patient

const nextPatient = async (req, res, next) => {
  try {
    const { unitId } = req.params;

    const next = await UnitQueue.findOneAndUpdate(
      {
        unit: unitId,
        status: "waiting",
      },
      {
        status: "in-progress",
      },
      {
        sort: { priority: -1, createdAt: 1 },
        new: true,
      }
    ).populate("patient", "hospitalId firstName lastName");

    if (!next)
      return res.status(404).json({ message: "No patients waiting" });

    res.json({
      success: true,
      message: "Next patient",
      data: next,
    });
  } catch (err) {
    next(err);
  }
};

//GET QUEUE PER UNIT
//GET /queue/:unitId

const getUnitQueue = async (req, res, next) => {
  try {
    const queue = await UnitQueue.find({
      unit: req.params.unitId,
      status: "waiting",
    })
      .populate("patient", "hospitalId firstName lastName")
      .sort({ priority: -1, createdAt: 1 });

    res.json({
      success: true,
      count: queue.length,
      data: queue,
    });
  } catch (error) {
    next(error);
  }
};

//TRANSFER PATIENT BETWEEN UNITS
//POST /queue/transfer

const transferPatient = async (req, res, next) => {
  try {
    const { patientId, from, to, reason } = req.body;

    // save transfer history
    await UnitTransfer.create({
      patient: patientId,
      from,
      to,
      reason,
      transferredBy: req.user?._id,
    });

    // update patient unit
    await Patient.findByIdAndUpdate(patientId, { unit: to });

    res.json({
      success: true,
      message: "Patient transferred successfully",
    });
  } catch (error) {
    next(error);
  }
};

//DAILY ATTENDANCE SUMMARY
//GET /attendance/today

const getTodayAttendance = async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const stats = await UnitAttendance.find({ date: today })
      .populate("unit", "name")
      .select("unit count -_id");

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// DASHBOARD STATS
//GET /dashboard/queue

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await UnitQueue.aggregate([
      { $match: { status: "waiting" } },
      {
        $group: {
          _id: "$unit",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "units",
          localField: "_id",
          foreignField: "_id",
          as: "unit",
        },
      },
      { $unwind: "$unit" },
      {
        $project: {
          name: "$unit.name",
          count: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};



module.exports = {
  addToQueue,
  nextPatient,
  getUnitQueue,
  transferPatient,
  getTodayAttendance,
  getDashboardStats,
};