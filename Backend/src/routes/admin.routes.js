const express = require('express');
const { verificarToken, verificarAdmin } = require('../middleware/auth');
const { 
  listarUsuarios, 
  crearUsuario, 
  actualizarUsuario,
  eliminarUsuario,
  listarRegistrosInteres,
  listarTodasSimulaciones,
  actualizarEstadoRegistro,
  buscarRegistros
} = require('../controllers/admin.controller');

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

module.exports = router;