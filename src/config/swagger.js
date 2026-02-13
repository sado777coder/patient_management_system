const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Patient Management System API",
      version: "1.0.0",
      description:
        "Hospital Billing + Ledger + Insurance + Stripe Payments API",
    },
    servers: [
      {
        url: "http://localhost:3004",
        description: "Local server",
      },
      {
        url: "https://patient-management-system-6jvc.onrender.com",
        description: "Production server",
      },
    ],
  },

  //  auto-scan everything
  apis: ["./src/**/*.js"],
};

module.exports = swaggerJsdoc(options);