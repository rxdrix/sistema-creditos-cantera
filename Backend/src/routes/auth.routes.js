import express from 'express';
import { register, login, getPerfil } from '../controllers/auth.controller.js';
import { verificarToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/perfil', verificarToken, getPerfil);

export default router;