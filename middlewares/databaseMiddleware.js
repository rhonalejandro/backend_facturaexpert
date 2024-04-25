const { getConnectionToken } = require('../helpers/databaseHelper');

const databaseMiddleware = async (req, res, next) => {
      try {
            const connectionDB = await getConnectionToken(req);
            if (connectionDB) {
                  req.connectionDB = connectionDB;
                  console.log('Conexión a la base de datos establecida Middleware');
            }
      } catch (error) {
            console.error('Error al obtener la conexión a la base de datos:', error);
            res.status(500).send({ ok: false, message: "Token errado o malformado" });
      }
      next();
};

module.exports = databaseMiddleware;