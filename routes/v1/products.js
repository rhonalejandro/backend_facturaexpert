const express = require('express');
const router = express.Router();
const { validateToken } = require('../../middlewares/authenticationMiddleware');
const ProductosController = require('../../controllers/productosController');
const databaseMiddleware = require('../../middlewares/databaseMiddleware')
router.use(databaseMiddleware);

router.get('/list', validateToken, async (req, res) => {
      const p = new ProductosController(req);
      const result = await p.listaProductos();
      res.status(200).send({items: result});
});

module.exports = router;
