const express = require('express');
const router = express.Router();
const { validateToken } = require('../../middlewares/authenticationMiddleware');
const EncabezadofacturasController = require('../../controllers/encabezadofacturasController');
const databaseMiddleware = require('../../middlewares/databaseMiddleware')
router.use(databaseMiddleware);

router.get('/orders', validateToken, async (req, res) => {
    const controller = new EncabezadofacturasController(req);
    const result = await e.getencabezadofacturas();
    res.status(200).send({items: result});
});

module.exports = router;
