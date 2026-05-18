import express from 'express';
import { verificarToken, verificarAdmin } from '../middleware/auth.js';
import { 
  listarUsuarios, 
  crearUsuario, 
  actualizarUsuario,
  eliminarUsuario,
  listarRegistrosInteres,
  listarTodasSimulaciones,
  actualizarEstadoRegistro,
  buscarRegistros
} from '../controllers/admin.controller.js';

const router = express.Router();

router.use(verificarToken);
router.use(verificarAdmin);

router.get('/usuarios', listarUsuarios);
router.post('/usuarios', crearUsuario);
router.put('/usuarios/:id', actualizarUsuario);
router.delete('/usuarios/:id', eliminarUsuario);
router.get('/registros-interes', listarRegistrosInteres);
router.get('/simulaciones', listarTodasSimulaciones);
router.put('/registros-interes/:id/estado', actualizarEstadoRegistro);
router.get('/registros-interes/buscar', buscarRegistros);

export default router;