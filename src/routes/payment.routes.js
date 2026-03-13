const express = require("express");
const router = express.Router();

const requireAuth = require("../middlewares/requireAuth");

const {
  createStripeCheckout,
  stripeWebhook,
} = require("../controllers/payment.controller");

router.post("/checkout", requireAuth, createStripeCheckout);

// Stripe webhook must NOT use auth
router.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

module.exports = router;