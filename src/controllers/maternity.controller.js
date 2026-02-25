const PregnancyModel = require("../models/Pregnancy");
const DeliveryModel = require("../models/Delivery");
const AntenatalVisitModel = require("../models/AntenatalVisit");
const PostnatalVisitModel = require("../models/PostnatalVisit");
const AbortionModel = require("../models/Abortion");
const ReferralModel = require("../models/Referral");
const auditLog = require ("../models/AuditLog");

/**
 * REGISTER PREGNANCY
 */
const createPregnancy = async (req, res, next) => {
  try {
    const pregnancy = await PregnancyModel.create(req.body);

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

    const [total, pregnancies] = await Promise.all([
      PregnancyModel.countDocuments(),
      PregnancyModel.find()
        .populate("patient")
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
      data: pregnancies,
    });

  } catch (err) {
    next(err);
  }
};

const getPregnancyById = async (req, res, next) => {
  try {
    const pregnancy = await PregnancyModel.findById(req.params.id)
      .populate("patient");

    if (!pregnancy) {
      return res.status(404).json({ message: "Pregnancy not found" });
    }

    res.status(200).json({
      success: true,
      data: pregnancy,
    });

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

    //  Check if pregnancy exists and is ongoing
    const pregnancy = await PregnancyModel.findById(pregnancyId);

    if (!pregnancy) {
      return res.status(404).json({
        message: "Pregnancy not found",
      });
    }

    if (pregnancy.status !== "ongoing") {
      return res.status(400).json({
        message: "Cannot record visit for non-active pregnancy",
      });
    }

    const visit = await AntenatalVisitModel.create(req.body);

    res.status(201).json({
      success: true,
      message: "Antenatal visit recorded",
      data: visit,
    });
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

    // Optional filter by pregnancy
    const filter = {};
    if (req.query.pregnancy) {
      filter.pregnancy = req.query.pregnancy;
    }

    const [total, visits] = await Promise.all([
      AntenatalVisitModel.countDocuments(filter),
      AntenatalVisitModel.find(filter)
        .populate({
          path: "pregnancy",
          populate: "patient",
        })
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
      data: visits,
    });

  } catch (err) {
    next(err);
  }
};

const getAntenatalVisitById = async (req, res, next) => {
  try {
    const visit = await AntenatalVisitModel.findById(req.params.id)
      .populate({
        path: "pregnancy",
        populate: "patient",
      });

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: "Antenatal visit not found",
      });
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
 * RECORD DELIVERY
 */
const createDelivery = async (req, res, next) => {
  try {
    const { pregnancy: pregnancyId } = req.body;

    // Check if pregnancy exists
    const pregnancy = await PregnancyModel.findById(pregnancyId);
    if (!pregnancy) {
      return res.status(404).json({ message: "Pregnancy not found" });
    }

    // Ensure pregnancy is ongoing
    if (pregnancy.status !== "ongoing") {
      return res.status(400).json({
        message: "Delivery already recorded or pregnancy inactive",
      });
    }

    // Check if a delivery already exists
    const existingDelivery = await DeliveryModel.findOne({ pregnancy: pregnancyId });
    if (existingDelivery) {
      return res.status(400).json({
        message: "Delivery already exists for this pregnancy",
      });
    }

    // Create the delivery
    const delivery = await DeliveryModel.create(req.body);

    // Update pregnancy status to "delivered"
    const updatedPregnancy = await PregnancyModel.findByIdAndUpdate(
      pregnancyId,
      { status: "delivered" },
      { new: true, runValidators: true }
    );

    // Populate the delivery with updated pregnancy
    const populatedDelivery = await DeliveryModel.findById(delivery._id)
      .populate({ path: "pregnancy", populate: "patient" });

    // Audit
    await auditLog({
  userId: req.user.id,
  action: "CREATE_DELIVERY",
  entity: "Delivery",
  entityId: delivery._id,
  metadata: {
    pregnancy: pregnancyId,
    deliveryDate: delivery.deliveryDate,
  },
});

    // Return the populated delivery
    res.status(201).json({
      success: true,
      message: "Delivery recorded successfully",
      data: populatedDelivery,
    });

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

    const [total, deliveries] = await Promise.all([
      DeliveryModel.countDocuments(),
      DeliveryModel.find()
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
      data: deliveries,
    });

  } catch (err) {
    next(err);
  }
};

const getDeliveryById = async (req, res, next) => {
  try {
    const delivery = await DeliveryModel.findById(req.params.id)
      .populate({ path: "pregnancy", populate: "patient" });

    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    res.status(200).json({
      success: true,
      data: delivery,
    });

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

    const pregnancy = await PregnancyModel.findById(id)
      .populate("patient");

    if (!pregnancy) {
      return res.status(404).json({
        message: "Pregnancy not found",
      });
    }

    const antenatalCount = await AntenatalVisitModel.countDocuments({
      pregnancy: id,
    });

    const postnatalCount = await PostnatalVisitModel.countDocuments({
      pregnancy: id,
    });

    const delivery = await DeliveryModel.findOne({
      pregnancy: id,
    });

    const abortion = await AbortionModel.findOne({
      pregnancy: id,
    });

    const referral = await ReferralModel.findOne({
      pregnancy: id,
    });

    res.status(200).json({
      success: true,
      data: {
        pregnancy,
        statistics: {
          antenatalVisits: antenatalCount,
          postnatalVisits: postnatalCount,
        },
        events: {
          delivery,
          abortion,
          referral,
        },
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
  getPregnancySummary
};