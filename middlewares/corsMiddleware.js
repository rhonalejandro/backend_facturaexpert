const cors = require('cors');
const dbConnection = require('../config/database');
require('dotenv').config();

function createCorsMiddleware() {
      const originSetting = process.env.CROSS_ALLOWED_ORIGIN || 'env';
      if (originSetting === 'env') {
            const allowedSites = process.env.CROSS_ALLOWED_SITES
                  ? process.env.CROSS_ALLOWED_SITES.split(',').map(site => site.trim())
                  : [];

            return cors({
                  origin: function (origin, callback) {
                        const isAllowed = allowedSites.includes(origin);
                        callback(null, isAllowed);
                  },
                  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
                  credentials: true,
                  optionsSuccessStatus: 204,
            });
      } else if (originSetting === 'mysql') {
            return cors({
                  origin: function (origin, callback) {
                        dbConnection.query('SELECT url FROM conf_allowed_urls', (error, results) => {
                              if (error) {
                                    console.error('Error al obtener URLs permitidas desde la base de datos:', error);
                                    return callback(error, false);
                              }

                              const allowedOrigins = results.map(result => result.url);
                              const isAllowed = allowedOrigins.includes(origin);

                              callback(null, isAllowed);
                        });
                  },
                  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
                  credentials: true,
                  optionsSuccessStatus: 204,
            });
      } else {
            // Opción no válida para CROSS_ALLOWED_ORIGIN
            throw new Error('Opción no válida para CROSS_ALLOWED_ORIGIN');
      }
}

module.exports = createCorsMiddleware;