const Joi = require("joi");

/**
 * FILTER AUDIT LOGS (query params)
 * GET /audit-logs
 */
const getAuditLogsValidator = Joi.object({
  user: Joi.string().optional(),

  action: Joi.string().optional(),

  collection: Joi.string().optional(),

  fromDate: Joi.date().optional(),

  toDate: Joi.date().optional(),

  page: Joi.number().min(1).optional(),

  limit: Joi.number().min(1).max(100).optional(),
});

module.exports = {
  getAuditLogsValidator,
};