import express from 'express';
import { verificarToken } from '../middleware/auth.js';
import { simularCredito, getHistorialSimulaciones, registrarInteres } from '../controllers/credito.controller.js';

const router = express.Router();

router.use(verificarToken);

router.post('/simular', simularCredito);
router.get('/historial', getHistorialSimulaciones);
router.post('/registrar-interes', registrarInteres);

export default router;