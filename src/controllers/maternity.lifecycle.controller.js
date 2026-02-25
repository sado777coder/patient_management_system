const PregnancyModel = require("../models/Pregnancy");
const AbortionModel = require("../models/Abortion");
const PostnatalVisitModel = require("../models/PostnatalVisit");
const ReferralModel = require("../models/Referral");
const logAudit = require("../models/AuditLog");

// Production-safe populate
const maternityPopulate = {
  path: "pregnancy",
  select: "gravida para status riskLevel",
  populate: {
    path: "patient",
    select: "hospitalId firstName lastName phone",
  },
};

/**
 * CREATE ABORTION
 * → Only allowed if pregnancy is ongoing
 * → Updates pregnancy status to "terminated"
 */
const createAbortion = async (req, res, next) => {
  try {
    const { pregnancy: pregnancyId } = req.body;
    const pregnancy = await PregnancyModel.findById(pregnancyId);

    if (!pregnancy) return res.status(404).json({ message: "Pregnancy not found" });
    if (pregnancy.status !== "ongoing")
      return res.status(400).json({ message: "Cannot record abortion for inactive pregnancy" });

    const abortion = await AbortionModel.create(req.body);

    pregnancy.status = "terminated";
    await pregnancy.save();

    await logAudit({
      userId: req.user.id,
      action: "CREATE_ABORTION",
      entity: "Abortion",
      entityId: abortion._id,
      metadata: { pregnancy: pregnancyId, gestationalAgeWeeks: abortion.gestationalAgeWeeks },
    });

    res.status(201).json({ success: true, message: "Abortion recorded successfully", data: abortion });
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

    const filter = {};

    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from);
      if (req.query.to) filter.date.$lte = new Date(req.query.to);
    }

    const pregnancies = await PregnancyModel.find({ hospitalId: req.user.hospitalId }).select("_id");
    filter.pregnancy = { $in: pregnancies.map((p) => p._id) };

    const [total, abortions] = await Promise.all([
      AbortionModel.countDocuments(filter),
      AbortionModel.find(filter)
        .populate(maternityPopulate)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json({
      success: true,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
      data: abortions,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ABORTION BY ID
 */
const getAbortionById = async (req, res, next) => {
  try {
    const abortion = await AbortionModel.findById(req.params.id).populate(maternityPopulate);

    if (!abortion) return res.status(404).json({ message: "Abortion not found" });
    if (abortion.pregnancy?.patient?.hospitalId?.toString() !== req.user.hospitalId?.toString())
      return res.status(403).json({ message: "Access denied" });

    res.status(200).json({ success: true, data: abortion });
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

    if (!pregnancy) return res.status(404).json({ message: "Pregnancy not found" });
    if (pregnancy.status !== "delivered")
      return res.status(400).json({ message: "Postnatal visits allowed only after delivery" });

    const visit = await PostnatalVisitModel.create(req.body);

    await logAudit({
      userId: req.user.id,
      action: "CREATE_POSTNATAL_VISIT",
      entity: "PostnatalVisit",
      entityId: visit._id,
      metadata: { pregnancy: pregnancyId, visitDate: visit.visitDate },
    });

    res.status(201).json({ success: true, message: "Postnatal visit recorded", data: visit });
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

    const filter = {};
    if (req.query.from || req.query.to) {
      filter.visitDate = {};
      if (req.query.from) filter.visitDate.$gte = new Date(req.query.from);
      if (req.query.to) filter.visitDate.$lte = new Date(req.query.to);
    }

    const pregnancies = await PregnancyModel.find({ hospitalId: req.user.hospitalId }).select("_id");
    filter.pregnancy = { $in: pregnancies.map((p) => p._id) };

    const [total, visits] = await Promise.all([
      PostnatalVisitModel.countDocuments(filter),
      PostnatalVisitModel.find(filter).populate(maternityPopulate).sort({ visitDate: -1 }).skip(skip).limit(limit),
    ]);

    res.status(200).json({ success: true, pagination: { total, page, pages: Math.ceil(total / limit), limit }, data: visits });
  } catch (err) {
    next(err);
  }
};

/**
 * GET POSTNATAL VISIT BY ID
 */
const getPostnatalVisitById = async (req, res, next) => {
  try {
    const visit = await PostnatalVisitModel.findById(req.params.id).populate(maternityPopulate);

    if (!visit) return res.status(404).json({ message: "Postnatal visit not found" });
    if (visit.pregnancy?.patient?.hospitalId?.toString() !== req.user.hospitalId?.toString())
      return res.status(403).json({ message: "Access denied" });

    res.status(200).json({ success: true, data: visit });
  } catch (err) {
    next(err);
  }
};

/**
 * CREATE REFERRAL
 * → Updates pregnancy status to "referred" if ongoing
 */
const createReferral = async (req, res, next) => {
  try {
    const { pregnancy: pregnancyId } = req.body;
    const pregnancy = await PregnancyModel.findById(pregnancyId);

    if (!pregnancy) return res.status(404).json({ message: "Pregnancy not found" });

    const referral = await ReferralModel.create(req.body);

    if (pregnancy.status === "ongoing") {
      pregnancy.status = "referred";
      await pregnancy.save();
    }

    await logAudit({
      userId: req.user.id,
      action: "CREATE_REFERRAL",
      entity: "Referral",
      entityId: referral._id,
      metadata: { pregnancy: pregnancyId, referredTo: referral.referredTo },
    });

    res.status(201).json({ success: true, message: "Referral recorded successfully", data: referral });
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

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.from || req.query.to) {
      filter.referralDate = {};
      if (req.query.from) filter.referralDate.$gte = new Date(req.query.from);
      if (req.query.to) filter.referralDate.$lte = new Date(req.query.to);
    }

    const pregnancies = await PregnancyModel.find({ hospitalId: req.user.hospitalId }).select("_id");
    filter.pregnancy = { $in: pregnancies.map((p) => p._id) };

    const [total, referrals] = await Promise.all([
      ReferralModel.countDocuments(filter),
      ReferralModel.find(filter).populate(maternityPopulate).sort({ referralDate: -1 }).skip(skip).limit(limit),
    ]);

    res.status(200).json({ success: true, pagination: { total, page, pages: Math.ceil(total / limit), limit }, data: referrals });
  } catch (err) {
    next(err);
  }
};

/**
 * GET REFERRAL BY ID
 */
const getReferralById = async (req, res, next) => {
  try {
    const referral = await ReferralModel.findById(req.params.id).populate(maternityPopulate);

    if (!referral) return res.status(404).json({ message: "Referral not found" });
    if (referral.pregnancy?.patient?.hospitalId?.toString() !== req.user.hospitalId?.toString())
      return res.status(403).json({ message: "Access denied" });

    res.status(200).json({ success: true, data: referral });
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