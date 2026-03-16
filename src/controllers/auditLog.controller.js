const AuditLog = require("../models/AuditLog");

/**
 * GET ALL LOGS (paginated + filtered)
 * admin only
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { user, action, entity, fromDate, toDate } = req.query;

    const filter = {
      hospital: req.user.hospital, // always restrict to hospital
    };

    if (user) filter.user = user;
    if (action) filter.action = action;
    if (entity) filter.entity = entity;

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const total = await AuditLog.countDocuments(filter);

    const logs = await AuditLog.find(filter)
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
  getAuditLogs,
};