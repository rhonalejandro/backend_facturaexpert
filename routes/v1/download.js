const express = require('express');
const { validateToken } = require('../../middlewares/authenticationMiddleware');
const DownloadController = require('../../controllers/downloadController');
const databaseMiddleware = require('../../middlewares/databaseMiddleware')

const router = express.Router();
router.use(databaseMiddleware);

router.get('/agents', validateToken, async (req, res) => {
  const controller = new DownloadController(req);
  const result = await controller.downloadAgentes();
  res.status(200).send({ data: result });
});

router.get('/orders', validateToken, async (req, res) => {
    const controller = new DownloadController(req);
    const result = await controller.downloadOrdenes();
    res.status(200).send({data: result});
});

router.get('/order-items', validateToken, async (req, res) => {
  const controller = new DownloadController(req);
  const result = await controller.downloadItemsOrdenes();
  res.status(200).send({ data: result });
});

router.get('/products', validateToken, async (req, res) => {
  const controller = new DownloadController(req);
  const result = await controller.downloadProducts();
  res.status(200).send({ data: result });
});

router.get('/provinces', validateToken, async (req, res) => {
    const controller = new DownloadController(req);
    const result = await controller.downloadProvinces();
    res.status(200).send({data: result});
});

router.get('/canton', validateToken, async (req, res) => {
    const controller = new DownloadController(req);
    const result = await controller.downloadCanton();
    res.status(200).send({data: result});
});

router.get('/clients', validateToken, async (req, res) => {
    const controller = new DownloadController(req);
    const result = await controller.downloadClientes();
    res.status(200).send({data: result});
});

router.get('/payments', validateToken, async (req, res) => {
    const controller = new DownloadController(req);
    const result = await controller.downloadRecibosPago();
    res.status(200).send({data: result});
});

router.get('/credit-notes', validateToken, async (req, res) => {
    const controller = new DownloadController(req);
    const result = await controller.downloadEncabezadoNc();
    res.status(200).send({ data: result });
});

router.get('/credit-notes-items', validateToken, async (req, res) => {
    const controller = new DownloadController(req);
    const result = await controller.downloadDetalleNc();
    res.status(200).send({ data: result });
});

router.get('/order-reprinted', validateToken, async (req, res) => {
    const controller = new DownloadController(req);
    const result = await controller.downloadReimpresionesFacturas();
    res.status(200).send({ data: result });
});

router.get('/payment-methods', validateToken, async (req, res) => {
  const controller = new DownloadController(req);
  const result = await controller.downloadMetodosPago();
  res.status(200).send({ data: result });
});


module.exports = router;
