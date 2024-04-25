const express = require('express');
const router = express.Router();
const { validateToken } = require('../../middlewares/authenticationMiddleware');
const CantonesController = require('../../controllers/cantonesController');
const databaseMiddleware = require('../../middlewares/databaseMiddleware')
router.use(databaseMiddleware);

router.get('/list', validateToken, async (req, res) => {
      const controller = new CantonesController(req);
      const result = await controller.listaCantones();
      res.status(200).send(result);
});

module.exports = router;
