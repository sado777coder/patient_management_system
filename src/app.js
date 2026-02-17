const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

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

const { stripeWebhook } = require("./controllers/payment.controller");

const app = express();

// Security

app.use(helmet());
app.use(cors({
  origin: "*", 
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));


// MUST BE FIRST (Stripe requires raw body)
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);


// normal JSON middleware AFTER webhook
app.use(express.json());

app.use(morgan("combined"));
app.use(logRequest);

app.get("/api/docs-json", (req, res) => {
  res.json(swaggerSpec);
});


// Swagger
app.get("/api/docs-json", (req, res) => res.json(swaggerSpec));

app.get("/cancel", (req, res) => {
  res.send(" Payment Cancelled");
});

app.get("/success", (req, res) => {
  res.send(" Payment Successful");
});

// Swagger UI
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ROUTES
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


// ERROR HANDLER LAST
app.use(errorHandler);

module.exports = app;