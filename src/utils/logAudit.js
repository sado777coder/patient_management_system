const AuditLog = require("../models/AuditLog");

const logAudit = async ({
  hospitalId,
  user,
  action,
  entity,
  entityId,
  metadata = {},
}) => {
  try {
    await AuditLog.create({
      hospital: hospitalId,
      user: user || null, 
      action,
      entity,
      entityId,
      metadata,
    });
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
};

module.exports = logAudit;