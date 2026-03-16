const PregnancyModel = require("../models/Pregnancy");
const DeliveryModel = require("../models/Delivery");
const AntenatalVisitModel = require("../models/AntenatalVisit");
const PostnatalVisitModel = require("../models/PostnatalVisit");
const AbortionModel = require("../models/Abortion");
const ReferralModel = require("../models/Referral");
const PatientModel = require("../models/Patient");
const clearCSVCache = require("../utils/invalidationCache");
const logAudit = require("../utils/logAudit");

/* ================================
   MULTI-TENANT QUERY HELPER
================================ */
const withHospital = (req, query = {}) => ({
  ...query,
  hospital: req.user.hospital,
});

/* ================================
   SAFE POPULATE
================================ */
const maternityPopulate = {
  path: "pregnancy",
  select: "gravida para status riskLevel",
  populate: {
    path: "patient",
    select: "hospital firstName lastName phone",
  },
};

/* ================================
   CREATE PREGNANCY
================================ */
const createPregnancy = async (req, res, next) => {
  try {
    const { patient } = req.body;

    const patientRecord = await PatientModel.findOne(
      withHospital(req, { _id: patient })
    );

    if (!patientRecord)
      return res.status(404).json({ message: "Patient not found" });

    const { hospital, ...safeBody } = req.body;

    const pregnancy = await PregnancyModel.create({
      ...safeBody,
      hospital: req.user.hospital,
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

/* ================================
   GET PREGNANCIES
================================ */
const getPregnancies = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const filter = withHospital(req);

    const [total, pregnancies] = await Promise.all([
      PregnancyModel.countDocuments(filter),
      PregnancyModel.find(filter)
        .populate({ path: "patient", select: "hospital firstName lastName phone" })
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
      data: pregnancies,
    });
  } catch (err) {
    next(err);
  }
};

/* ================================
   GET PREGNANCY BY ID
================================ */
const getPregnancyById = async (req, res, next) => {
  try {
    const pregnancy = await PregnancyModel.findOne(
      withHospital(req, { _id: req.params.id })
    ).populate("patient");

    if (!pregnancy)
      return res.status(404).json({ message: "Pregnancy not found" });

    res.status(200).json({ success: true, data: pregnancy });
  } catch (err) {
    next(err);
  }
};

/* ================================
   CREATE ANTENATAL VISIT
================================ */
const createAntenatalVisit = async (req, res, next) => {
  try {
    const { pregnancy: pregnancyId } = req.body;

    const pregnancy = await PregnancyModel.findOne(
      withHospital(req, { _id: pregnancyId })
    );

    if (!pregnancy)
      return res.status(404).json({ message: "Pregnancy not found" });

    if (pregnancy.status !== "ongoing")
      return res.status(400).json({
        message: "Cannot record visit for non-active pregnancy",
      });

    const { hospital, ...safeBody } = req.body;

    const visit = await AntenatalVisitModel.create({
      ...safeBody,
      hospital: req.user.hospital,
    });

    await clearCSVCache("antenatal", req.user.hospital);

    res.status(201).json({
      success: true,
      message: "Antenatal visit recorded",
      data: visit,
    });
  } catch (err) {
    next(err);
  }
};

/* ================================
   GET ANTENATAL VISITS
================================ */
const getAntenatalVisits = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const filter = withHospital(req);

    if (req.query.from || req.query.to) {
      filter.visitDate = {};
      if (req.query.from) filter.visitDate.$gte = new Date(req.query.from);
      if (req.query.to) filter.visitDate.$lte = new Date(req.query.to);
    }

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

/* ================================
   GET ANTENATAL VISIT BY ID
================================ */
const getAntenatalVisitById = async (req, res, next) => {
  try {
    const visit = await AntenatalVisitModel.findOne(
      withHospital(req, { _id: req.params.id })
    ).populate(maternityPopulate);

    if (!visit)
      return res.status(404).json({ message: "Antenatal visit not found" });

    res.status(200).json({ success: true, data: visit });
  } catch (err) {
    next(err);
  }
};

/* ================================
   CREATE DELIVERY
================================ */
const createDelivery = async (req, res, next) => {
  try {
    const { pregnancy: pregnancyId } = req.body;

    const pregnancy = await PregnancyModel.findOne(
      withHospital(req, { _id: pregnancyId })
    );

    if (!pregnancy)
      return res.status(404).json({ message: "Pregnancy not found" });

    const existingDelivery = await DeliveryModel.findOne(
      withHospital(req, { pregnancy: pregnancyId })
    );

    if (existingDelivery)
      return res.status(400).json({
        message: "Delivery already exists for this pregnancy",
      });

    const { hospital, ...safeBody } = req.body;

    const delivery = await DeliveryModel.create({
      ...safeBody,
      hospital: req.user.hospital,
    });

    pregnancy.status = "delivered";
    await pregnancy.save();

    await clearCSVCache("deliveries", req.user.hospital);

   await logAudit({
  hospitalId: req.user.hospital,
  userId: req.user.id,
  action: "CREATE_DELIVERY",
  entity: "Delivery",
  entityId: delivery._id,
  metadata: {
    pregnancy: pregnancyId,
    deliveryDate: delivery.deliveryDate,
    type: delivery.type,
  }
});

    res.status(201).json({
      success: true,
      message: "Delivery recorded successfully",
      data: delivery,
    });
  } catch (err) {
    next(err);
  }
};

/* ================================
   GET DELIVERIES
================================ */
const getDeliveries = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const filter = withHospital(req);

    if (req.query.from || req.query.to) {
      filter.deliveryDate = {};
      if (req.query.from) filter.deliveryDate.$gte = new Date(req.query.from);
      if (req.query.to) filter.deliveryDate.$lte = new Date(req.query.to);
    }

    const [total, deliveries] = await Promise.all([
      DeliveryModel.countDocuments(filter),
      DeliveryModel.find(filter)
        .populate(maternityPopulate)
        .sort({ deliveryDate: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json({
      success: true,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
      data: deliveries,
    });
  } catch (err) {
    next(err);
  }
};

/* ================================
   GET DELIVERY BY ID
================================ */
const getDeliveryById = async (req, res, next) => {
  try {
    const delivery = await DeliveryModel.findOne(
      withHospital(req, { _id: req.params.id })
    ).populate(maternityPopulate);

    if (!delivery)
      return res.status(404).json({ message: "Delivery not found" });

    res.status(200).json({ success: true, data: delivery });
  } catch (err) {
    next(err);
  }
};

/* ================================
   PREGNANCY TIMELINE
================================ */
const getPregnancyTimeline = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pregnancy = await PregnancyModel.findOne(
      withHospital(req, { _id: id })
    ).populate("patient");

    if (!pregnancy)
      return res.status(404).json({ message: "Pregnancy not found" });

    const [
      antenatalVisits,
      referrals,
      delivery,
      abortion,
      postnatalVisits
    ] = await Promise.all([
      AntenatalVisitModel.find(withHospital(req, { pregnancy: id })),
      ReferralModel.find(withHospital(req, { pregnancy: id })),
      DeliveryModel.findOne(withHospital(req, { pregnancy: id })),
      AbortionModel.findOne(withHospital(req, { pregnancy: id })),
      PostnatalVisitModel.find(withHospital(req, { pregnancy: id }))
    ]);

    const timeline = [];

    // Pregnancy created
    timeline.push({
      event: "Pregnancy Registered",
      date: pregnancy.createdAt,
      details: {
        gravida: pregnancy.gravida,
        para: pregnancy.para
      }
    });

    // Antenatal visits
    antenatalVisits.forEach(v => {
      timeline.push({
        event: "Antenatal Visit",
        date: v.visitDate,
        details: {
          bloodPressure: v.bloodPressure,
          weight: v.weight
        }
      });
    });

    // Referrals
    referrals.forEach(r => {
      timeline.push({
        event: "Referral",
        date: r.referralDate,
        details: {
          referredTo: r.referredTo,
          reason: r.reason
        }
      });
    });

    // Delivery
    if (delivery) {
      timeline.push({
        event: "Delivery",
        date: delivery.deliveryDate,
        details: {
          type: delivery.type,
          outcome: delivery.outcome
        }
      });
    }

    // Abortion
    if (abortion) {
      timeline.push({
        event: "Abortion",
        date: abortion.date,
        details: {
          reason: abortion.reason
        }
      });
    }

    // Postnatal visits
    postnatalVisits.forEach(v => {
      timeline.push({
        event: "Postnatal Visit",
        date: v.visitDate,
        details: {
          notes: v.notes
        }
      });
    });

    // Sort timeline
    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      success: true,
      pregnancy: {
        id: pregnancy._id,
        patient: pregnancy.patient,
        status: pregnancy.status
      },
      timeline
    });

  } catch (err) {
    next(err);
  }
};

/* ================================
   PREGNANCY SUMMARY
================================ */
const getPregnancySummary = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pregnancy = await PregnancyModel.findOne(
      withHospital(req, { _id: id })
    ).populate("patient");

    if (!pregnancy)
      return res.status(404).json({ message: "Pregnancy not found" });

    const [antenatalCount, postnatalCount, delivery, abortion, referral] =
      await Promise.all([
        AntenatalVisitModel.countDocuments(
          withHospital(req, { pregnancy: id })
        ),
        PostnatalVisitModel.countDocuments(
          withHospital(req, { pregnancy: id })
        ),
        DeliveryModel.findOne(withHospital(req, { pregnancy: id })),
        AbortionModel.findOne(withHospital(req, { pregnancy: id })),
        ReferralModel.findOne(withHospital(req, { pregnancy: id })),
      ]);

    res.status(200).json({
      success: true,
      data: {
        pregnancy,
        statistics: {
          antenatalVisits: antenatalCount,
          postnatalVisits: postnatalCount,
        },
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
  getPregnancyTimeline,
  getPregnancySummary,
};