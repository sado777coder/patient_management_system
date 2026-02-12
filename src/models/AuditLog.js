const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: String,
    collection: String,
    recordId: mongoose.Schema.Types.ObjectId,
    metadata: Object,
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);