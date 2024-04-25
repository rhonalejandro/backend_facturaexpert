const express = require('express');
const router = express.Router();
const { validateToken } = require('../../middlewares/authenticationMiddleware');
const OrdenesController = require('../../controllers/ordenesController');
const databaseMiddleware = require('../../middlewares/databaseMiddleware');
const notascreditoController = require('../../controllers/notascreditoController')

router.use(databaseMiddleware);

router.get('/list', validateToken, async (req, res) => {
      const o = new OrdenesController(req);
      const result = await o.getOrdenes();
      res.status(200).send({ items: result });
});

router.get('/:id', validateToken, async (req, res) => {
  const orderId = req.params.id;
  const orderController = new OrdenesController(req);
  const creditNoteController = new notascreditoController(req);

  const result = await orderController.getOrderById(orderId);
  const items = await orderController.getItemsByOrderId(orderId);
  const notascredito = await creditNoteController.getNotasdecreditobyidfactura(orderId);
  const pagos = await orderController.getPaymentsByOrderId(orderId)
  res.status(200).send({ order: result, items: items, credit_notes: notascredito, payments: pagos });
});

router.get('/items/:id', validateToken, async (req, res) => {
  const orderId = req.params.id;

  const orderController = new OrdenesController(req);
  const items = await orderController.getItemsByOrderId(orderId);
  res.status(200).send({ data: items });
});

router.post('/add', validateToken, async (req, res) => {
      const a = new OrdenesController(req);
      const result = await a.postagregarorden();
      res.status(200).send({ data: result, message: "Agregado correctamente" });
});

router.post('/orders', validateToken, async (req, res) => {
      const c = new OrdenesController(req);
      const results = await c.postcargarordenes();
      const items = await c.postcargarordenesitems();
      res.status(200).send({ data: results, items:items,payments:[], credit_notes:[]});
});

router.put('/cancel/:id', validateToken, async (req, res) => {
  const af = new OrdenesController(req);
  const id = req.params.id;
  const result = await af.putAnularOrden(id);
  res.status(200).send({message: "Factura anulada correctamente"});
});

module.exports = router;