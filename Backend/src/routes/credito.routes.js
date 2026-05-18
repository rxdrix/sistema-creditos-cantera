const express = require('express');
const { verificarToken } = require('../middleware/auth');
const { simularCredito, getHistorialSimulaciones, registrarInteres } = require('../controllers/credito.controller');

const router = express.Router();

router.use(verificarToken);

router.post('/simular', simularCredito);
router.get('/historial', getHistorialSimulaciones);
router.post('/registrar-interes', registrarInteres);

module.exports = router;