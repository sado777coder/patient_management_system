const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");

// Load YAML files if they exist
const swaggerDir = path.join(__dirname, "swagger");
let swaggerYamls = [];

if (fs.existsSync(swaggerDir)) {
  swaggerYamls = fs
    .readdirSync(swaggerDir)
    .filter((file) => file.endsWith(".yaml"))
    .map((file) => path.join(swaggerDir, file));
}

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Patient Management System API",
      version: "1.0.0",
      description: "Hospital Billing + Ledger + Insurance + Stripe Payments API",
    },
    servers: [
      { url: "http://localhost:3004", description: "Local server" },
      { url: "https://patient-management-system-6jvc.onrender.com", description: "Production server" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        Patient: {
          type: "object",
          properties: {
            _id: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            phone: { type: "string" },
            createdAt: { type: "string" },
          },
        },
        Invoice: {
          type: "object",
          properties: {
            _id: { type: "string" },
            patient: { type: "string" },
            totalAmount: { type: "number" },
            status: { type: "string" },
          },
        },
        LedgerTransaction: {
          type: "object",
          properties: {
            type: { type: "string" },
            amount: { type: "number" },
            description: { type: "string" },
            createdAt: { type: "string" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Scan JS files + YAMLs
  apis: ["./src/**/*.js", ...swaggerYamls],
};

module.exports = swaggerJsdoc(options);