const Stripe = require("stripe");
const Billing = require("../models/Billing");
const Ledger = require("../models/LedgerTransaction");
const { invalidatePatient } = require("../utils/cacheInvalidation");

const stripe = new Stripe(process.env.STRIPE_SECRET);


// CREATE CHECKOUT
const createStripeCheckout = async (req, res, next) => {
  try {
    const { patient, amount } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "ghs",
            product_data: { name: "Hospital Bill Payment" },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,

      metadata: {
        patient,
        amount,
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
};


// WEBHOOK (SECURE)

const stripeWebhook = async (req, res, next) => {
  try {
    const sig = req.headers["stripe-signature"];

    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const { patient, amount } = event.data.object.metadata;

      const account = await Billing.findOne({ patient });

      if (!account) return res.json({ received: true });

      await Ledger.create({
        account: account._id,
        patient,
        type: "payment",
        amount: -Number(amount),
        description: "Stripe payment",
      });

      account.balance -= Number(amount);
      await account.save();

      // clear cache
      await invalidatePatient(patient);
    }

    res.json({ received: true });
  } catch (err) {
    console.error(err.message);
    res.status(400).send(`Webhook Error`);
  }
};

module.exports = {
  createStripeCheckout,
  stripeWebhook,
};