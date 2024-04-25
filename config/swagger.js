const swaggerJSDoc = require('swagger-jsdoc');

const options = {
      definition: {
            openapi: '3.0.0',
            info: {
                  title: 'FacturaExpert Api',
                  version: '1.0.0',
                  description: 'FacturaExpert Api',
            },
            securityDefinitions: {
                  BearerAuth: {
                        type: 'apiKey',
                        name: 'Authorization',
                        in: 'header',
                  },
            },
      },
      apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
