const PregnancyModel = require("../models/Pregnancy");
const AbortionModel = require("../models/Abortion");
const PostnatalVisitModel = require("../models/PostnatalVisit");
const DeliveryModel = require("../models/Delivery");
const ReferralModel = require("../models/Referral");
const clearCSVCache = require("../utils/invalidationCache");
const logAudit = require("../utils/logAudit");

// Multi-tenant query helper
const withHospital = (req, query = {}) => ({
  ...query,
  hospital: req.user.hospital,
});

// Production-safe populate
const maternityPopulate = {
  path: "pregnancy",
  select: "gravida para status riskLevel",
  populate: {
    path: "patient",
    select: "hospital firstName lastName phone",
  },
};

/* ================================
   CREATE ABORTION
================================ */
const createAbortion = async (req, res, next) => {
  try {
    const { pregnancy: pregnancyId } = req.body;

    // Validate pregnancy belongs to hospital
    const pregnancy = await PregnancyModel.findOne(
      withHospital(req, { _id: pregnancyId })
    );

    if (!pregnancy)
      return res.status(404).json({ message: "Pregnancy not found" });

    if (pregnancy.status !== "ongoing")
      return res.status(400).json({
        message: "Cannot record abortion for inactive pregnancy",
      });

      const existingAbortion = await AbortionModel.findOne(
  withHospital(req, { pregnancy: pregnancyId })
);

if (existingAbortion)
  return res.status(400).json({
    message: "Abortion already recorded for this pregnancy",
  });

    // Create abortion (ONLY ONCE)
    const { hospital, ...safeBody } = req.body;
    const abortion = await AbortionModel.create({
      ...safeBody,
      hospital: req.user.hospital,
    });

    // Update pregnancy
    pregnancy.status = "terminated";
    await pregnancy.save();

    // Clear cache correctly
    await clearCSVCache("abortions", req.user.hospital);

    // Audit
    await logAudit({
  hospitalId: req.user.hospital,
  user: req.user._id,
  action: "CREATE_ABORTION",
  entity: "Abortion",
  entityId: abortion._id,
  metadata: {
    pregnancy: pregnancyId,
    abortionDate: abortion.date
  }
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

/* ================================
   GET ABORTIONS
================================ */
const getAbortions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const filter = withHospital(req);

    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from);
      if (req.query.to) filter.date.$lte = new Date(req.query.to);
    }

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

/* ================================
   GET ABORTION BY ID
================================ */
const getAbortionById = async (req, res, next) => {
  try {
    const abortion = await AbortionModel.findOne(
      withHospital(req, { _id: req.params.id })
    ).populate(maternityPopulate);

    if (!abortion)
      return res.status(404).json({ message: "Abortion not found" });

    res.status(200).json({ success: true, data: abortion });
  } catch (err) {
    next(err);
  }
};

/* ================================
   CREATE POSTNATAL VISIT
================================ */
const createPostnatalVisit = async (req, res, next) => {
  try {
    const { pregnancy: pregnancyId } = req.body;

    const pregnancy = await PregnancyModel.findOne(
      withHospital(req, { _id: pregnancyId })
    );

    if (!pregnancy)
      return res.status(404).json({ message: "Pregnancy not found" });

    const deliveryExists = await DeliveryModel.findOne(
      withHospital(req, { pregnancy: pregnancyId })
    );

    if (!deliveryExists)
      return res.status(400).json({
        message: "Postnatal visits allowed only after delivery",
      });

      const { hospital, ...safeBody } = req.body;

    const visit = await PostnatalVisitModel.create({
      ...safeBody,
      hospital: req.user.hospital,
    });

    await clearCSVCache("postnatal", req.user.hospital);

   await logAudit({
  hospitalId: req.user.hospital,
  user: req.user._id,
  action: "CREATE_POSTNATAL_VISIT",
  entity: "PostnatalVisit",
  entityId: visit._id,
  metadata: {
    pregnancy: pregnancyId,
    visitDate: visit.visitDate
  }
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

/* ================================
   GET POSTNATAL VISITS
================================ */
const getPostnatalVisits = async (req, res, next) => {
  try {
    const filter = withHospital(req);

    const visits = await PostnatalVisitModel.find(filter)
      .populate(maternityPopulate)
      .sort({ visitDate: -1 });

    res.status(200).json({ success: true, data: visits });
  } catch (err) {
    next(err);
  }
};

/* ================================
   GET POSTNATAL VISIT BY ID
================================ */
const getPostnatalVisitById = async (req, res, next) => {
  try {
    const visit = await PostnatalVisitModel.findOne(
      withHospital(req, { _id: req.params.id })
    ).populate(maternityPopulate);

    if (!visit)
      return res.status(404).json({ message: "Postnatal visit not found" });

    res.status(200).json({ success: true, data: visit });
  } catch (err) {
    next(err);
  }
};

/* ================================
   CREATE REFERRAL
================================ */
const createReferral = async (req, res, next) => {
  try {
    const { pregnancy: pregnancyId } = req.body;

    const pregnancy = await PregnancyModel.findOne(
      withHospital(req, { _id: pregnancyId })
    );

    if (!pregnancy)
      return res.status(404).json({ message: "Pregnancy not found" });

    const { hospital, ...safeBody } = req.body;

    const referral = await ReferralModel.create({
      ...safeBody,
      hospital: req.user.hospital,
    });

    if (pregnancy.status === "ongoing") {
      pregnancy.status = "referred";
      await pregnancy.save();
    }

    await clearCSVCache("referrals", req.user.hospital);

    await logAudit({
  hospitalId: req.user.hospital,
  user: req.user._id,
  action: "CREATE_REFERRAL",
  entity: "Referral",
  entityId: referral._id,
  metadata: {
    pregnancy: pregnancyId,
    referredTo: referral.referredTo
  }
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

/* ================================
   GET REFERRALS (PAGINATED)
================================ */
const getReferrals = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const filter = withHospital(req);

    // Optional date filter
    if (req.query.from || req.query.to) {
      filter.referralDate = {};
      if (req.query.from) filter.referralDate.$gte = new Date(req.query.from);
      if (req.query.to) filter.referralDate.$lte = new Date(req.query.to);
    }

    const [total, referrals] = await Promise.all([
      ReferralModel.countDocuments(filter),
      ReferralModel.find(filter)
        .populate(maternityPopulate)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
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


/* ================================
   GET REFERRAL BY ID
================================ */
const getReferralById = async (req, res, next) => {
  try {
    const referral = await ReferralModel.findOne(
      withHospital(req, { _id: req.params.id })
    ).populate(maternityPopulate);

    if (!referral)
      return res.status(404).json({ message: "Referral not found" });

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
  getReferralById 
};