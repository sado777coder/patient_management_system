require('dotenv').config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const stripe = require("stripe")(process.env.STRIPE_SECRET);

const logRequest = require("./middlewares/logRequest");
const errorHandler = require("./middlewares/errorHandler");

const authRoute = require("./routes/auth.routes");
const userRoute = require("./routes/users.routes");
const patientsRoute = require("./routes/patients.routes");
const visitsRoute = require("./routes/visits.routes");
const billingRoute = require("./routes/billing.routes");
const labRoute = require("./routes/lab.routes");
const auditRoute = require("./routes/audit.routes");
const prescriptionRoute = require("./routes/prescription.routes");
const medicalRecordRoute = require("./routes/medicalRecord.routes");
const maternityRoute = require("./routes/maternity.routes");
const dispenseRoute = require("./routes/dispense.routes");
const triageRoute = require("./routes/triage.routes");
const bedRoute = require("./routes/bed.routes");
const dischargeRoute = require("./routes/discharge.routes");
const admissionRoute = require("./routes/admission.routes");
const unitRoute = require("./routes/unit.routes");
const queueRoute = require("./routes/queue.routes");
const reportRoute = require("./routes/report.routes");
const insuranceRoute = require("./routes/insurance.routes");
const paymentRoute = require("./routes/payment.routes");
const diagnosisRoute = require("./routes/diagnoses.routes");
const labOrderRoute = require("./routes/labOrders.routes");
const { swaggerUi, swaggerSpec } = require("./config/swagger");

const app = express();

// --- Security Middleware ---
app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
app.use(morgan("combined"));
app.use(logRequest);

// --- Stripe Webhook Route (must be BEFORE express.json())
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.log("Webhook signature verification failed.", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle Stripe events
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        console.log("PaymentIntent was successful!", paymentIntent.id);
        break;
      case "charge.succeeded":
        const charge = event.data.object;
        console.log(" Charge succeeded:", charge.id);
        break;
      default:
        console.log(` Unhandled Stripe event: ${event.type}`);
    }

    res.send(); // acknowledge receipt
  }
);

// --- JSON body parser for normal requests (AFTER webhook) ---
app.use(express.json());

// --- Swagger JSON ---
app.get("/api/docs-json", (req, res) => res.json(swaggerSpec));

// --- Swagger UI ---
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- Payment routes for success/cancel pages ---
app.get("/cancel", (req, res) => res.send("Payment Cancelled"));
app.get("/success", (req, res) => res.send("Payment Successful"));

// --- Main Routes ---
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/patients", patientsRoute);
app.use("/api/unit", unitRoute);
app.use("/api/visits", visitsRoute);
app.use("/api/diagnoses", diagnosisRoute);
app.use("/api/lab-orders", labOrderRoute);
app.use("/api/claim", insuranceRoute); 
app.use("/api/queue", queueRoute);
app.use("/api/payments", paymentRoute);
app.use("/api/reports", reportRoute);
app.use("/api/billing", billingRoute);
app.use("/api/lab", labRoute);
app.use("/api/audit", auditRoute);
app.use("/api/prescriptions", prescriptionRoute);
app.use("/api/records", medicalRecordRoute);
app.use("/api/maternity", maternityRoute);
app.use("/api/dispenses", dispenseRoute);
app.use("/api/triage", triageRoute);
app.use("/api/beds", bedRoute);
app.use("/api/discharges", dischargeRoute);
app.use("/api/admissions", admissionRoute);

// --- Error handler (last) ---
app.use(errorHandler);

module.exports = app;