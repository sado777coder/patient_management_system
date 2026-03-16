const AuditLog = require("../models/AuditLog");

const logAudit = async ({
  hospitalId,
  userId,
  action,
  entity,
  entityId,
  metadata
}) => {
  try {
    await AuditLog.create({
      hospital: hospitalId,
      user: userId,
      action,
      entity,
      entityId,
      metadata
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};

module.exports = logAudit;