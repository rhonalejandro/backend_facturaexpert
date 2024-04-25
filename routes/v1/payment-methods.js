const express = require('express');
const router = express.Router();
const { validateToken } = require('../../middlewares/authenticationMiddleware');
const MetodosPagoController = require('../../controllers/metodosPagoController');
const databaseMiddleware = require('../../middlewares/databaseMiddleware')
router.use(databaseMiddleware);

router.get('/list', validateToken, async (req, res) => {
      const controller = new MetodosPagoController(req);
      const result = await controller.listaMetodos();
      res.status(200).send({ data: result });
});

module.exports = router;
