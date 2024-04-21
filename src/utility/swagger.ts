/**
 * there is two way to implement swagger
 * 1. using YAML file
 * 2. using swagger-jsdoc
 *
 * here we are using swagger-jsdoc
 *
 * but i am using YAML file in my project
 * you can ignore this file if you are using YAML file
 *
 * i keep this file for reference
 */

import swaggerJsdoc from "swagger-jsdoc";

const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Your API Title",
      version: "1.0.0",
      description: "Description of your API",
    },
  },
  apis: ["./src/routes/*.ts"], // Path to your TypeScript route files
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
