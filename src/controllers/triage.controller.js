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
      success:true,
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

    const filter = {
      hospital: req.user.hospital,
      isDeleted: false,
    };

    const [triages, total] = await Promise.all([
      TriageModel.find(filter)
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

      TriageModel.countDocuments(filter),
    ]);

    res.status(200).json({
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

    res.status(200).json({
      success: true,
      data: triage,
    });
  } catch (err) {
    next(err);
  }
};

// Search Triage
const searchTriages = async (req, res, next) => {
  try {
    const keyword = req.query.q?.trim();

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Search query required",
      });
    }

    const triages = await TriageModel.find({
      hospital: req.user.hospital,
      $or: [
        { complaint: { $regex: keyword, $options: "i" } },
      ],
    })
      .populate({
        path: "visit",
        populate: {
          path: "patient",
          select: "firstName lastName",
        },
      })
      .populate("triagedBy", "name role")
      .limit(20);

    res.json({
      success: true,
      data: triages,
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
  { _id: req.params.id, hospital: req.user.hospital , isDeleted: false,},
  req.body,
  { new: true, runValidators: true }
);

    res.status(200).json({
      success:true,
      message:"Your updates",
       data: triage });
  } catch (err) {
    next(err);
  }
};


/**
 * DELETE TRIAGE (admin)
 */
const deleteTriage = async (req, res, next) => {
  try {
    const triage = await TriageModel.findOneAndUpdate(
      { _id: req.params.id, hospital: req.user.hospital, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!triage) {
      return res.status(404).json({
        success: false,
        message: "Triage record not found or already deleted",
      });
    }

    res.status(200).json({
      success: true,
      message: "Triage record soft-deleted successfully",
      data: triage,
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
}