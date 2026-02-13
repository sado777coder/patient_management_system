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

    
      //Adds JWT auth button in Swagger UI
    
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },

      /*
        Optional starter schemas (you can expand later)
      */
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

    /*
      Apply auth globally
    */
    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  //  scan ALL files (routes + docs folder)
  apis: ["./src/**/*.js"],
};

module.exports = swaggerJsdoc(options);