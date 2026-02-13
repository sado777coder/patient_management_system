
/**
 * @swagger
 * tags:
 *   name: Insurance
 *   description: Insurance claims
 */

/**
 * @swagger
 * /api/claim/{invoiceId}:
 *   post:
 *     summary: Submit insurance claim
 *     tags: [Insurance]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 */

/**
 * @swagger
 * /api/claim/{claimId}/approve:
 *   post:
 *     summary: Approve insurance claim
 *     tags: [Insurance]
 */