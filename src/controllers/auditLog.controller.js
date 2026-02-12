const AuditLogModel = require("../models/AuditLog");


/**
 * GET ALL LOGS (paginated + filtered)
 * admin only
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { user, action, collection, fromDate, toDate } = req.query;

    const filter = {};

    if (user) filter.user = user;
    if (action) filter.action = action;
    if (collection) filter.collection = collection;

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const total = await AuditLogModel.countDocuments(filter);

    const logs = await AuditLogModel.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: "Audit logs fetched",
      total,
      page,
      pages: Math.ceil(total / limit),
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
 getAuditLogs
};