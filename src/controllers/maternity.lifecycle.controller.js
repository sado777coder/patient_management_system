const PregnancyModel = require("../models/Pregnancy");
const AbortionModel = require("../models/Abortion");
const PostnatalVisitModel = require("../models/PostnatalVisit");
const ReferralModel = require("../models/Referral");
const logAudit = require("../models/AuditLog");

/**
 * CREATE ABORTION
 * → Only allowed if pregnancy is ongoing
 * → Updates pregnancy status to "terminated"
 */
const createAbortion = async (req, res, next) => {
  try {
    const { pregnancy: pregnancyId } = req.body;

    const pregnancy = await PregnancyModel.findById(pregnancyId);

    if (!pregnancy) {
      return res.status(404).json({ message: "Pregnancy not found" });
    }

    if (pregnancy.status !== "ongoing") {
      return res.status(400).json({
        message: "Cannot record abortion for inactive pregnancy",
      });
    }

    const abortion = await AbortionModel.create(req.body);

    pregnancy.status = "terminated";
    await pregnancy.save();

    // Audit
    await logAudit({
      userId: req.user.id,
      action: "CREATE_ABORTION",
      entity: "Abortion",
      entityId: abortion._id,
      metadata: {
        pregnancy: pregnancyId,
        gestationalAgeWeeks: abortion.gestationalAgeWeeks,
      },
    });

    res.status(201).json({
      success: true,
      message: "Abortion recorded successfully",
      data: abortion,
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET ABORTIONS
 */
const getAbortions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const [total, abortions] = await Promise.all([
      AbortionModel.countDocuments(),
      AbortionModel.find()
        .populate({ path: "pregnancy", populate: "patient" })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      data: abortions,
    });

  } catch (err) {
    next(err);
  }
};

const getAbortionById = async (req, res, next) => {
  try {
    const abortion = await AbortionModel.findById(req.params.id)
      .populate({ path: "pregnancy", populate: "patient" });

    if (!abortion) {
      return res.status(404).json({ message: "Abortion not found" });
    }

    res.status(200).json({
      success: true,
      data: abortion,
    });

  } catch (err) {
    next(err);
  }
};

/**
 * CREATE POSTNATAL VISIT
 * → Only allowed if pregnancy is delivered
 */
const createPostnatalVisit = async (req, res, next) => {
  try {
    const { pregnancy: pregnancyId } = req.body;

    const pregnancy = await PregnancyModel.findById(pregnancyId);

    if (!pregnancy) {
      return res.status(404).json({ message: "Pregnancy not found" });
    }

    if (pregnancy.status !== "delivered") {
      return res.status(400).json({
        message: "Postnatal visits allowed only after delivery",
      });
    }

    const visit = await PostnatalVisitModel.create(req.body);

    // Audit
    await logAudit({
      userId: req.user.id,
      action: "CREATE_POSTNATAL_VISIT",
      entity: "PostnatalVisit",
      entityId: visit._id,
      metadata: {
        pregnancy: pregnancyId,
        visitDate: visit.visitDate,
      },
    });

    res.status(201).json({
      success: true,
      message: "Postnatal visit recorded",
      data: visit,
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET POSTNATAL VISITS
 */
const getPostnatalVisits = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const [total, visits] = await Promise.all([
      PostnatalVisitModel.countDocuments(),
      PostnatalVisitModel.find()
        .populate({ path: "pregnancy", populate: "patient" })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      data: visits,
    });

  } catch (err) {
    next(err);
  }
};

const getPostnatalVisitById = async (req, res, next) => {
  try {
    const visit = await PostnatalVisitModel.findById(req.params.id)
      .populate({ path: "pregnancy", populate: "patient" });

    if (!visit) {
      return res.status(404).json({ message: "Postnatal visit not found" });
    }

    res.status(200).json({
      success: true,
      data: visit,
    });

  } catch (err) {
    next(err);
  }
};

/**
 * CREATE REFERRAL
 * → Only allowed if pregnancy is ongoing
 * → Updates pregnancy status to "referred"
 */
const createReferral = async (req, res, next) => {
  try {
    const { pregnancy: pregnancyId } = req.body;

    const pregnancy = await PregnancyModel.findById(pregnancyId);

    if (!pregnancy) {
      return res.status(404).json({ message: "Pregnancy not found" });
    }

    const referral = await ReferralModel.create(req.body);

    // OPTIONAL:
    // Only change status if pregnancy is still ongoing
    if (pregnancy.status === "ongoing") {
      pregnancy.status = "referred";
      await pregnancy.save();
    }

    await logAudit({
      userId: req.user.id,
      action: "CREATE_REFERRAL",
      entity: "Referral",
      entityId: referral._id,
      metadata: {
        pregnancy: pregnancyId,
        referredTo: referral.referredTo,
      },
    });

    res.status(201).json({
      success: true,
      message: "Referral recorded successfully",
      data: referral,
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET REFERRALS
 */
const getReferrals = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const [total, referrals] = await Promise.all([
      ReferralModel.countDocuments(),
      ReferralModel.find()
        .populate({ path: "pregnancy", populate: "patient" })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      data: referrals,
    });

  } catch (err) {
    next(err);
  }
};

const getReferralById = async (req, res, next) => {
  try {
    const referral = await ReferralModel.findById(req.params.id)
      .populate({ path: "pregnancy", populate: "patient" });

    if (!referral) {
      return res.status(404).json({ message: "Referral not found" });
    }

    res.status(200).json({
      success: true,
      data: referral,
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  createAbortion,
  getAbortions,
  getAbortionById,
  createPostnatalVisit,
  getPostnatalVisits,
  getPostnatalVisitById,
  createReferral,
  getReferrals,
  getReferralById,
};