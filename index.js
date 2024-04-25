const express = require('express');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const bodyParser = require("body-parser");

const createCorsMiddleware = require('./middlewares/corsMiddleware');
const notfoundMiddleware = require('./middlewares/notfoundMiddleware'); // Importa el nuevo middleware
const loadRoutes = require('./routes');
const PORT = process.env.PORT || 8000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
      extended: true
}));
app.use(morgan('dev'))

app.use(createCorsMiddleware());
loadRoutes(app);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(notfoundMiddleware);

app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
});