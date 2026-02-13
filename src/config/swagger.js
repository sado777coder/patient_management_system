const swaggerUi = require("swagger-ui-express");
const yaml = require("yamljs");
const path = require("path");

const swaggerDocument = yaml.load(
  path.join(__dirname, "swagger.yaml")
);

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(swaggerDocument),
  json: swaggerDocument,
};