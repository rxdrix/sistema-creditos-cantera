const express = require('express');
const { verificarToken } = require('../middleware/auth');
const { 
  simularCredito, 
  simularCreditoConCuota,
  getHistorialSimulaciones, 
  registrarInteres 
} = require('../controllers/credito.controller');

const router = express.Router();

router.use(verificarToken);

router.post('/simular', simularCredito);
router.post('/simular-con-cuota', simularCreditoConCuota);
router.get('/historial', getHistorialSimulaciones);
router.post('/registrar-interes', registrarInteres);

module.exports = router;