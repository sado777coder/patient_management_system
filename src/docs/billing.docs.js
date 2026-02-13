/**
 * @swagger
 * tags:
 *   name: Billing
 *   description: Billing, invoices, payments and ledger transactions
 */

/**
 * @swagger
 * /api/billing/{patientId}/balance:
 *   get:
 *     summary: Get patient account balance
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient balance returned
 */

/**
 * @swagger
 * /api/billing/{patientId}/ledger:
 *   get:
 *     summary: Get ledger history for a patient
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ledger transactions list
 */

/**
 * @swagger
 * /api/billing/invoice:
 *   post:
 *     summary: Create invoice for patient
 *     tags: [Billing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             patient: "65f123abc"
 *             items:
 *               - name: Consultation
 *                 amount: 200
 *               - name: Lab Test
 *                 amount: 150
 *     responses:
 *       201:
 *         description: Invoice created successfully
 */

/**
 * @swagger
 * /api/billing/charge:
 *   post:
 *     summary: Add charge to patient account
 *     tags: [Billing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             patient: "65f123abc"
 *             description: "Medication"
 *             amount: 50
 *     responses:
 *       201:
 *         description: Charge added
 */

/**
 * @swagger
 * /api/billing/payment:
 *   post:
 *     summary: Record manual payment (cash/insurance)
 *     tags: [Billing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             patient: "65f123abc"
 *             amount: 100
 *             method: cash
 *     responses:
 *       201:
 *         description: Payment recorded
 */