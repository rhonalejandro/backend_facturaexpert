const express = require('express');
const router = express.Router();
const { validateToken } = require('../../middlewares/authenticationMiddleware');
const ClientesController = require('../../controllers/clientesController');
const ListaclientesporagenteController = require('../../controllers/listaclientesporagenteController');
const databaseMiddleware = require('../../middlewares/databaseMiddleware')
router.use(databaseMiddleware);

router.get('/list', validateToken, async (req, res) => {
      const controller = new ClientesController(req);
      const result = await controller.listaClientes();
      res.status(200).send({ items: result.registrosPaginados });
});

router.get('/by_agent/:agent', validateToken, async (req, res) => {
      const controller = new ListaclientesporagenteController(req);
      const id_user = req.params.agent;
      const result = await controller.getListaClientesByAgente(id_user);
      res.status(200).send({ items: result });
});

router.post('/add', validateToken, async (req, res) => {
      const controller = new ClientesController(req);
      const result = await controller.postagregarcliente();
      res.status(200).send(result );
});
module.exports = router;
