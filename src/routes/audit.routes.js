const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const validate = require("../middlewares/validate");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");

const { getAuditLogs } = require("../controllers/auditLog.controller");
const { getAuditLogsValidator } = require("../validators/auditLog.validator");

router.use(requireAuth);

router.get(
  "/",
 allowRoles(permissions.MANAGE_USERS),
  validate(getAuditLogsValidator, "query"),
  getAuditLogs
);

module.exports = router;