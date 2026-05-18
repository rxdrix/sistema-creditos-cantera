const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { nombre, email, telefono, password } = req.body;
    
    const userExists = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO usuarios (nombre, email, telefono, password_hash, rol)
      VALUES ($1, $2, $3, $4, 'usuario')
      RETURNING id, nombre, email, telefono, rol
    `;
    
    const values = [nombre, email, telefono, passwordHash];
    const result = await pool.query(query, values);
    
    const token = jwt.sign(
      { id: result.rows[0].id, email: result.rows[0].email, rol: result.rows[0].rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.json({
      success: true,
      token,
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error en register:', error.message);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔍 Login intento para:', email);
    
    const result = await pool.query(
      'SELECT id, nombre, email, telefono, password_hash, rol, activo FROM usuarios WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Usuario no encontrado:', email);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    const usuario = result.rows[0];
    
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    
    if (!passwordValido) {
      console.log('❌ Contraseña incorrecta para:', email);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    delete usuario.password_hash;
    
    console.log('✅ Login exitoso para:', email);
    
    res.json({
      success: true,
      token,
      usuario
    });
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

const getPerfil = async (req, res) => {
  try {
    console.log('🔍 getPerfil llamado, usuario:', req.usuario);
    
    if (!req.usuario || !req.usuario.id) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    
    const result = await pool.query(
      'SELECT id, nombre, email, telefono, rol FROM usuarios WHERE id = $1',
      [req.usuario.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error en getPerfil:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

module.exports = { register, login, getPerfil };