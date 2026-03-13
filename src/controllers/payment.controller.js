const Stripe = require("stripe");
const Billing = require("../models/Billing");
const Ledger = require("../models/LedgerTransaction");
const { invalidatePatient } = require("../utils/cacheInvalidation");

const stripe = new Stripe(process.env.STRIPE_SECRET);

/**
 * CREATE STRIPE CHECKOUT
 */
const createStripeCheckout = async (req, res, next) => {
  try {
    const { patient, amount } = req.body;

    const amountPesewas = Math.round(amount * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Hospital Bill Payment" },
            unit_amount: amountPesewas,
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,

      metadata: {
        patient: String(patient),
        hospital: String(req.user.hospital),
        amount: String(amountPesewas),
      }
    });

    res.json({ url: session.url });

  } catch (err) {
    next(err);
  }
};

// WEBHOOK (SECURE)

const stripeWebhook = async (req, res, next) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    next (err);
  }

  try {

    // prevent duplicate processing
    const existing = await Ledger.findOne({ reference: event.id });
    if (existing) return res.json({ received: true });

    if (event.type === "checkout.session.completed") {

      const session = event.data.object;

      const patient = session.metadata.patient;
      const hospital = session.metadata.hospital;
      const amount = Number(session.metadata.amount);

      const account = await Billing.findOne({
        patient,
        hospital,
      });

      if (!account) return res.json({ received: true });

      await Ledger.create({
        hospital,
        account: account._id,
        patient,
        type: "payment",
        amount: -amount,
        description: "Stripe payment",
        reference: event.id,
      });

      account.balance -= amount;
      await account.save();

      await invalidatePatient(patient);
    }

    res.json({ received: true });

  } catch (err) {
    console.error(err);
    next (err);
  }
};

module.exports = {
  createStripeCheckout,
  stripeWebhook,
};