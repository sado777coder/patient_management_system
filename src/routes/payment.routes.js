const express = require("express");
const router = express.Router();
const {
  createStripeCheckout,
  stripeWebhook,
} = require("../controllers/payment.controller");

// patient starts payment
router.post("/checkout", createStripeCheckout);

// stripe calls this (NO auth middleware here)
router.post("/webhook/stripe", stripeWebhook);


module.exports = router;