const TriageModel = require("../models/Triage");

/**
 * CREATE TRIAGE
 */
const createTriage = async (req, res, next) => {
  try {
    const triage = await TriageModel.create({
      ...req.body,
      hospital: req.user.hospital,
      triagedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Recorded",
      data: triage,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET TRIAGES
 */
const getTriages = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const [triages, total] = await Promise.all([
      TriageModel.find({
        hospital: req.user.hospital,
        isDeleted: false,
      })
        .populate({
          path: "visit",
          populate: {
            path: "patient",
            select: "firstName lastName",
          },
        })
        .populate("triagedBy", "name role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      TriageModel.countDocuments({
        hospital: req.user.hospital,
        isDeleted: false,
      }),
    ]);

    res.json({
      success: true,
      data: triages,
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
 * GET TRIAGE BY ID
 */
const getTriageById = async (req, res, next) => {
  try {
    const triage = await TriageModel.findOne({
      _id: req.params.id,
      hospital: req.user.hospital,
      isDeleted: false,
    })
      .populate({
        path: "visit",
        populate: {
          path: "patient",
          select: "firstName lastName",
        },
      })
      .populate("triagedBy", "name role");

    if (!triage) {
      return res.status(404).json({
        success: false,
        message: "Triage not found",
      });
    }

    res.json({ success: true, data: triage });
  } catch (err) {
    next(err);
  }
};

/**
 *  SEARCH (AGGREGATION)
 */
const searchTriages = async (req, res, next) => {
  try {
    const keyword = req.query.q?.trim();

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Search query required",
      });
    }

    const results = await TriageModel.aggregate([
      {
        $match: {
          hospital: req.user.hospital,
          isDeleted: false,
        },
      },

      // JOIN VISITS
      {
        $lookup: {
          from: "visits",
          localField: "visit",
          foreignField: "_id",
          as: "visit",
        },
      },
      { $unwind: "$visit" },

      // JOIN PATIENTS
      {
        $lookup: {
          from: "patients",
          localField: "visit.patient",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: "$patient" },

      // SEARCH
      {
        $match: {
          $or: [
            { complaint: { $regex: keyword, $options: "i" } },
            { "patient.firstName": { $regex: keyword, $options: "i" } },
            { "patient.lastName": { $regex: keyword, $options: "i" } },
          ],
        },
      },

      // CLEAN RESPONSE
      {
        $project: {
          complaint: 1,
          priority: 1,
          vitals: 1,
          createdAt: 1,
          "patient.firstName": 1,
          "patient.lastName": 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: results,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE TRIAGE
 */
const updateTriage = async (req, res, next) => {
  try {
    const triage = await TriageModel.findOneAndUpdate(
      {
        _id: req.params.id,
        hospital: req.user.hospital,
        isDeleted: false,
      },
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Updated",
      data: triage,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE TRIAGE
 */
const deleteTriage = async (req, res, next) => {
  try {
    const triage = await TriageModel.findOneAndUpdate(
      {
        _id: req.params.id,
        hospital: req.user.hospital,
        isDeleted: false,
      },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!triage) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    res.json({
      success: true,
      message: "Deleted",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTriage,
  getTriages,
  getTriageById,
  searchTriages,
  updateTriage,
  deleteTriage,
};