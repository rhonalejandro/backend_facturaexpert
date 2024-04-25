const express = require('express');
const router = express.Router();
const { validateToken } = require('../../middlewares/authenticationMiddleware');
const NotascreditoController = require('../../controllers/notascreditoController');
const databaseMiddleware = require('../../middlewares/databaseMiddleware')
router.use(databaseMiddleware);

router.get('/list', validateToken, async (req, res) => {
  const controller = new NotascreditoController(req);
  const result = await controller.getNotascredito();
  res.status(200).send({ data: result });
});

router.get('/:id', validateToken, async (req, res) => {
  const controller = new NotascreditoController(req);
  const result = await controller.getNotascredito();
  res.status(200).send({ data: result });
});

// router.post('/add', validateToken, async (req, res) => {
//   const controller = new NotascreditoController(req);
//   const insertedId = await controller.postagregarnc();
//   const items = await controller.postagregarncitmes();
//   res.status(200).send({ data: insertedId });

// });

router.post('/create/:id', validateToken, async (req, res) => {
  const controller = new NotascreditoController(req);
  const result = await controller.postCrearNCPorIdFactura();
  res.status(200).send({ data: result });
});

module.exports = router;