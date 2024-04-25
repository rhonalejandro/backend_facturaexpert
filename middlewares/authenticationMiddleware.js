const jwt = require('jsonwebtoken');
require('dotenv').config();

const validateToken = (req, res, next) => {
      const token = req.header('Authorization');
      const splitterToken = token.split(" ");
      let accessToken = splitterToken[0];
      if (splitterToken[0].toLowerCase() == "bearer")
      {
            accessToken = splitterToken[1];
      }
      if (!accessToken) {
            return res.status(401).send({ok:false, message: 'Token no proporcionado'});
      }
      jwt.verify(accessToken, process.env.SECRET_KEY_JWT, (err, user) => {
            if (err) {
                  return res.status(403).send({ ok: false, message: 'Token inválido'});
            }
            req.user = user;
            next();
      });
};

module.exports = { validateToken };