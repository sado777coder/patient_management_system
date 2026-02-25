const PregnancyModel = require("../models/Pregnancy");
const DeliveryModel = require("../models/Delivery");
const AntenatalVisitModel = require("../models/AntenatalVisit");
const PostnatalVisitModel = require("../models/PostnatalVisit");
const AbortionModel = require("../models/Abortion");
const ReferralModel = require("../models/Referral");
const auditLog = require("../models/AuditLog");

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
 * REGISTER PREGNANCY
 */
const createPregnancy = async (req, res, next) => {
  try {
    const pregnancy = await PregnancyModel.create({
      ...req.body,
      hospitalId: req.user.hospitalId, // enforce tenant binding
    });

    res.status(201).json({
      success: true,
      message: "Maternal client created",
      data: pregnancy,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET PREGNANCIES
 */
const getPregnancies = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const filter = { hospitalId: req.user.hospitalId };

    const [total, pregnancies] = await Promise.all([
      PregnancyModel.countDocuments(filter),
      PregnancyModel.find(filter)
        .populate({ path: "patient", select: "hospitalId firstName lastName phone" })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      data: pregnancies,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET PREGNANCY BY ID
 */
const getPregnancyById = async (req, res, next) => {
  try {
    const pregnancy = await PregnancyModel.findById(req.params.id)
      .populate({ path: "patient", select: "hospitalId firstName lastName phone" });

    if (!pregnancy) return res.status(404).json({ message: "Pregnancy not found" });

    if (pregnancy.patient?.hospitalId?.toString() !== req.user.hospitalId?.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json({ success: true, data: pregnancy });
  } catch (err) {
    next(err);
  }
};

/**
 * CREATE ANTENATAL VISIT
 */
const createAntenatalVisit = async (req, res, next) => {
  try {
    const { pregnancy: pregnancyId } = req.body;
    const pregnancy = await PregnancyModel.findById(pregnancyId);

    if (!pregnancy) return res.status(404).json({ message: "Pregnancy not found" });
    if (pregnancy.status !== "ongoing")
      return res.status(400).json({ message: "Cannot record visit for non-active pregnancy" });

    const visit = await AntenatalVisitModel.create(req.body);

    res.status(201).json({ success: true, message: "Antenatal visit recorded", data: visit });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ANTENATAL VISITS
 */
const getAntenatalVisits = async (req, res, next) => {
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
      AntenatalVisitModel.countDocuments(filter),
      AntenatalVisitModel.find(filter)
        .populate(maternityPopulate)
        .sort({ visitDate: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json({
      success: true,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
      data: visits,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ANTENATAL VISIT BY ID
 */
const getAntenatalVisitById = async (req, res, next) => {
  try {
    const visit = await AntenatalVisitModel.findById(req.params.id).populate(maternityPopulate);

    if (!visit) return res.status(404).json({ message: "Antenatal visit not found" });

    if (visit.pregnancy?.patient?.hospitalId?.toString() !== req.user.hospitalId?.toString())
      return res.status(403).json({ message: "Access denied" });

    res.status(200).json({ success: true, data: visit });
  } catch (err) {
    next(err);
  }
};

/**
 * RECORD DELIVERY
 */
const createDelivery = async (req, res, next) => {
  try {
    const { pregnancy: pregnancyId } = req.body;
    const pregnancy = await PregnancyModel.findById(pregnancyId);

    if (!pregnancy) return res.status(404).json({ message: "Pregnancy not found" });
    if (pregnancy.status !== "ongoing")
      return res.status(400).json({ message: "Delivery already recorded or pregnancy inactive" });

    const existingDelivery = await DeliveryModel.findOne({ pregnancy: pregnancyId });
    if (existingDelivery) return res.status(400).json({ message: "Delivery already exists for this pregnancy" });

    const delivery = await DeliveryModel.create(req.body);

    await PregnancyModel.findByIdAndUpdate(pregnancyId, { status: "delivered" }, { new: true });

    const populatedDelivery = await DeliveryModel.findById(delivery._id)
      .populate({ path: "pregnancy", populate: "patient" });

    await auditLog({
      userId: req.user.id,
      action: "CREATE_DELIVERY",
      entity: "Delivery",
      entityId: delivery._id,
      metadata: { pregnancy: pregnancyId, deliveryDate: delivery.deliveryDate },
    });

    res.status(201).json({ success: true, message: "Delivery recorded successfully", data: populatedDelivery });
  } catch (err) {
    next(err);
  }
};

/**
 * GET DELIVERIES
 */
const getDeliveries = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.from || req.query.to) {
      filter.deliveryDate = {};
      if (req.query.from) filter.deliveryDate.$gte = new Date(req.query.from);
      if (req.query.to) filter.deliveryDate.$lte = new Date(req.query.to);
    }

    const pregnancies = await PregnancyModel.find({ hospitalId: req.user.hospitalId }).select("_id");
    filter.pregnancy = { $in: pregnancies.map((p) => p._id) };

    const [total, deliveries] = await Promise.all([
      DeliveryModel.countDocuments(filter),
      DeliveryModel.find(filter).populate(maternityPopulate).sort({ deliveryDate: -1 }).skip(skip).limit(limit),
    ]);

    res.status(200).json({ success: true, pagination: { total, page, pages: Math.ceil(total / limit), limit }, data: deliveries });
  } catch (err) {
    next(err);
  }
};

/**
 * GET DELIVERY BY ID
 */
const getDeliveryById = async (req, res, next) => {
  try {
    const delivery = await DeliveryModel.findById(req.params.id).populate(maternityPopulate);

    if (!delivery) return res.status(404).json({ message: "Delivery not found" });

    if (delivery.pregnancy?.patient?.hospitalId?.toString() !== req.user.hospitalId?.toString())
      return res.status(403).json({ message: "Access denied" });

    res.status(200).json({ success: true, data: delivery });
  } catch (err) {
    next(err);
  }
};

/**
 * PREGNANCY SUMMARY
 */
const getPregnancySummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pregnancy = await PregnancyModel.findById(id).populate("patient");

    if (!pregnancy) return res.status(404).json({ message: "Pregnancy not found" });

    const [antenatalCount, postnatalCount, delivery, abortion, referral] = await Promise.all([
      AntenatalVisitModel.countDocuments({ pregnancy: id }),
      PostnatalVisitModel.countDocuments({ pregnancy: id }),
      DeliveryModel.findOne({ pregnancy: id }),
      AbortionModel.findOne({ pregnancy: id }),
      ReferralModel.findOne({ pregnancy: id }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        pregnancy,
        statistics: { antenatalVisits: antenatalCount, postnatalVisits: postnatalCount },
        events: { delivery, abortion, referral },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPregnancy,
  getPregnancies,
  getPregnancyById,
  createAntenatalVisit,
  getAntenatalVisits,
  getAntenatalVisitById,
  createDelivery,
  getDeliveries,
  getDeliveryById,
  getPregnancySummary,
};