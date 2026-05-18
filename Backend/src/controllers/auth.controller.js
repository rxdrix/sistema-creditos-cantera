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
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.json({
      success: true,
      token,
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query(
      'SELECT id, nombre, email, telefono, password_hash, rol, activo FROM usuarios WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    const usuario = result.rows[0];
    
    if (!usuario.activo) {
      return res.status(401).json({ message: 'Usuario desactivado' });
    }
    
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    
    if (!passwordValido) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    delete usuario.password_hash;
    
    res.json({
      success: true,
      token,
      usuario
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const getPerfil = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, telefono, rol, fecha_registro FROM usuarios WHERE id = $1',
      [req.usuario.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { register, login, getPerfil };