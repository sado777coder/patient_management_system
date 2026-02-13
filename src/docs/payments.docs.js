/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Stripe payments
 */

/**
 * @swagger
 * /api/payments/checkout:
 *   post:
 *     summary: Create Stripe checkout session
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Returns Stripe checkout URL
 */

/**
 * @swagger
 * /api/stripe/webhook:
 *   post:
 *     summary: Stripe webhook callback
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook received
 */