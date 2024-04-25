const express = require('express');
const router = express.Router();
const { validateToken } = require('../../middlewares/authenticationMiddleware');
const RecibopagoController = require('../../controllers/RecibopagoController');
const databaseMiddleware = require('../../middlewares/databaseMiddleware')
router.use(databaseMiddleware);

router.get('/by_id/:id', validateToken, async (req, res) => {
      const r = new RecibopagoController(req);
      const IdInstruccion = req.params.id;
      const result = await r.getRecibopago(IdInstruccion);
      res.status(200).send({ items: result });
});

router.post('/add', validateToken, async (req, res) => {
      const r = new RecibopagoController(req);
      const result = await r.postagregarpago();
      res.status(200).send({ detail: result });
});

module.exports = router;
