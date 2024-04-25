const express = require('express');
const router = express.Router();
const { validateToken } = require('../../middlewares/authenticationMiddleware');
const ProvinciasController = require('../../controllers/provinciasController');
const databaseMiddleware = require('../../middlewares/databaseMiddleware')
router.use(databaseMiddleware);

router.get('/list', validateToken, async (req, res) => {
      const p = new ProvinciasController(req);
      const result = await p.listaProvincias();
      res.status(200).send(result);
});

module.exports = router;
