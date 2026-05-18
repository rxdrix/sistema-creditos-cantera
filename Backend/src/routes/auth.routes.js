const express = require('express');
const { register, login, getPerfil } = require('../controllers/auth.controller');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/perfil', verificarToken, getPerfil);

module.exports = router;