const express = require('express');
const { validateToken } = require('../../middlewares/authenticationMiddleware');
const UploadController = require('../../controllers/uploadController');
const databaseMiddleware = require('../../middlewares/databaseMiddleware')

const router = express.Router();
router.use(databaseMiddleware);

router.post('/orders/', validateToken, async (req, res) => {
    const controller = new UploadController(req);
    const result = await controller.uploadOrdenes();
    res.status(200).send({data: result});
});

router.post('/client', validateToken, async (req, res) => {
    const controller = new UploadController(req);
    const result = await controller.uploadClientes();
    res.status(200).send({data: result});
});

router.post('/payments', validateToken, async (req, res) => {
    const controller = new UploadController(req);
    const result = await controller.uploadRecibosPago();
    res.status(200).send({data: result});
});

router.post('/credit-notes', validateToken, async (req, res) => {
    const controller = new UploadController(req);
    const result = await controller.uploadEncabezadoNc();
    res.status(200).send({ data: result });
});

router.post('/order-reprinted', validateToken, async (req, res) => {
    const controller = new UploadController(req);
    const result = await controller.uploadReimpresionesFacturas();
    res.status(200).send({ data: result });
});


module.exports = router;
