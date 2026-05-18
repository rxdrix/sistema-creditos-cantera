import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';

export const listarUsuarios = async (req, res) => {
  try {
    console.log('📋 [ADMIN] Listando usuarios');
    const query = `SELECT id, nombre, email, telefono, rol, activo FROM usuarios ORDER BY id DESC`;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('❌ Error en listarUsuarios:', error.message);
    res.status(500).json({ message: 'Error al listar usuarios', error: error.message });
  }
};

export const listarRegistrosInteres = async (req, res) => {
  try {
    console.log('📋 [ADMIN] Listando registros de interés');
    const query = `
      SELECT ri.*, u.nombre as usuario_registro 
      FROM registros_interes ri 
      LEFT JOIN usuarios u ON ri.usuario_id = u.id 
      ORDER BY ri.id DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error en listarRegistrosInteres:', error.message);
    res.status(500).json({ message: 'Error al listar registros', error: error.message });
  }
};

export const listarTodasSimulaciones = async (req, res) => {
  try {
    console.log('📋 [ADMIN] Listando simulaciones');
    const query = `SELECT * FROM simulaciones ORDER BY id DESC LIMIT 100`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error en listarTodasSimulaciones:', error.message);
    res.status(500).json({ message: 'Error al listar simulaciones', error: error.message });
  }
};

export const actualizarEstadoRegistro = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const query = `UPDATE registros_interes SET estado = $1 WHERE id = $2 RETURNING *`;
    const result = await pool.query(query, [estado, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
    res.json({ success: true, registro: result.rows[0] });
  } catch (error) {
    console.error('❌ Error en actualizarEstadoRegistro:', error.message);
    res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
  }
};

export const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, telefono, password, rol } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const query = `INSERT INTO usuarios (nombre, email, telefono, password_hash, rol, activo) VALUES ($1, $2, $3, $4, $5, true) RETURNING id, nombre, email, rol`;
    const values = [nombre, email, telefono, passwordHash, rol || 'usuario'];
    const result = await pool.query(query, values);
    res.json({ success: true, usuario: result.rows[0] });
  } catch (error) {
    console.error('❌ Error en crearUsuario:', error.message);
    res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
};

export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;
    
    // No permitir cambiar el propio rol
    if (parseInt(id) === req.usuario.id) {
      return res.status(400).json({ message: 'No puedes cambiar tu propio rol' });
    }
    
    const query = `UPDATE usuarios SET rol = $1 WHERE id = $2 RETURNING id, nombre, email, rol`;
    const result = await pool.query(query, [rol, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json({ success: true, usuario: result.rows[0] });
  } catch (error) {
    console.error('❌ Error en actualizarUsuario:', error.message);
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
};

export const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (parseInt(id) === req.usuario.id) {
      return res.status(400).json({ message: 'No puedes eliminar tu propio usuario' });
    }
    
    const query = `DELETE FROM usuarios WHERE id = $1 RETURNING id`;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error en eliminarUsuario:', error.message);
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};

export const buscarRegistros = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, nombre } = req.query;
    
    let query = `
      SELECT ri.*, u.nombre as usuario_registro 
      FROM registros_interes ri 
      LEFT JOIN usuarios u ON ri.usuario_id = u.id 
      WHERE 1=1
    `;
    let params = [];
    let paramIndex = 1;
    
    if (fechaInicio && fechaFin) {
      query += ` AND ri.fecha_registro::date BETWEEN $${paramIndex}::date AND $${paramIndex + 1}::date`;
      params.push(fechaInicio, fechaFin);
      paramIndex += 2;
    }
    
    if (nombre && nombre.trim() !== '') {
      query += ` AND ri.nombre_completo ILIKE $${paramIndex}`;
      params.push(`%${nombre}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY ri.fecha_registro DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error en buscarRegistros:', error.message);
    res.status(500).json({ message: 'Error al buscar registros', error: error.message });
  }
};