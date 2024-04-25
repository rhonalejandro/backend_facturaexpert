const express = require('express');
const router = express.Router();
const { validateToken } = require('../../middlewares/authenticationMiddleware');
const ConfiguracionController = require('../../controllers/configController');
const databaseMiddleware = require('../../middlewares/databaseMiddleware')
router.use(databaseMiddleware);

router.get('/', validateToken, async (req, res) => {
      const controller = new ConfiguracionController(req);
      const result = await controller.getConfiguracion();
      res.status(200).send({ data: result });
});

module.exports = router;
