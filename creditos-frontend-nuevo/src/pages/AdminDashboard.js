import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

// Importar jspdf solo si está instalado
let jsPDF;
let autoTable;
try {
  const jspdf = require('jspdf');
  const jspdfAutotable = require('jspdf-autotable');
  jsPDF = jspdf.jsPDF;
  autoTable = jspdfAutotable.default;
} catch (e) {
  console.log('jspdf no instalado - ejecutar: npm install jspdf jspdf-autotable');
}

const API_URL = 'https://sistema-creditos-backend.vercel.app/api';

function AdminDashboard() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [registrosInteres, setRegistrosInteres] = useState([]);
  const [simulaciones, setSimulaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', email: '', telefono: '', password: '', rol: 'usuario' });
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [nombreBuscar, setNombreBuscar] = useState('');
  const [filtroActivo, setFiltroActivo] = useState(false);

  useEffect(() => {
  if (usuario && usuario.rol !== 'admin') {
    navigate('/simulador');
  }
  cargarDatos();
}, [usuario, navigate]);
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [usuariosRes, registrosRes, simulacionesRes] = await Promise.all([
        axios.get(`${API_URL}/admin/usuarios`),
        axios.get(`${API_URL}/admin/registros-interes`),
        axios.get(`${API_URL}/admin/simulaciones`)
      ]);
      setUsuarios(usuariosRes.data);
      setRegistrosInteres(registrosRes.data);
      setSimulaciones(simulacionesRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const buscarRegistros = async () => {
    if (!fechaInicio && !fechaFin && !nombreBuscar) {
      toast.error('Ingrese al menos un criterio de búsqueda');
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);
      if (nombreBuscar) params.append('nombre', nombreBuscar);
      
      const res = await axios.get(`${API_URL}/admin/registros-interes/buscar?${params}`);
      setRegistrosInteres(res.data);
      setFiltroActivo(true);
      toast.success(`${res.data.length} registros encontrados`);
    } catch (error) {
      toast.error('Error al buscar');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltro = async () => {
    setFechaInicio('');
    setFechaFin('');
    setNombreBuscar('');
    setFiltroActivo(false);
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/registros-interes`);
      setRegistrosInteres(res.data);
    } catch (error) {
      toast.error('Error al recargar');
    } finally {
      setLoading(false);
    }
  };

  const descargarReportePDF = () => {
    if (!jsPDF) {
      toast.error('Librería PDF no instalada. Ejecute: npm install jspdf jspdf-autotable');
      return;
    }
    
    if (registrosInteres.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    
    try {
      const doc = new jsPDF('landscape');
      
      doc.setFillColor(27, 94, 32);
      doc.rect(0, 0, 297, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('SOCIETARIA CANTERA R.L.', 148.5, 20, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text('Reporte de Solicitudes de Crédito', 148.5, 45, { align: 'center' });
      doc.setFontSize(9);
      doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 60);
      
      const tableColumn = ['ID', 'Nombre', 'Email', 'Teléfono', 'Monto', 'Plazo', 'Estado', 'Registrado por', 'Fecha'];
      const tableRows = registrosInteres.map(reg => [
        reg.id,
        reg.nombre_completo,
        reg.email,
        reg.telefono || '-',
        reg.monto_interes ? reg.monto_interes.toLocaleString('es-ES') : '0',
        reg.plazo_interes ? `${reg.plazo_interes} meses` : '-',
        reg.estado || 'pendiente',
        reg.usuario_registro || 'Usuario web',
        new Date(reg.fecha_registro).toLocaleDateString()
      ]);
      
      if (autoTable) {
        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 80,
          theme: 'striped',
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [27, 94, 32], textColor: 255 }
        });
      } else {
        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 80,
          theme: 'striped',
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [27, 94, 32], textColor: 255 }
        });
      }
      
      doc.save(`solicitudes_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF generado');
    } catch (error) {
      console.error(error);
      toast.error('Error al generar PDF');
    }
  };

  const generarPDFSimulaciones = () => {
    if (!jsPDF) {
      toast.error('Librería PDF no instalada');
      return;
    }
    
    if (simulaciones.length === 0) {
      toast.error('No hay simulaciones para exportar');
      return;
    }
    
    try {
      const doc = new jsPDF('landscape');
      
      doc.setFillColor(27, 94, 32);
      doc.rect(0, 0, 297, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('CANTERA R.L.', 148.5, 20, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text('Reporte de Simulaciones', 148.5, 45, { align: 'center' });
      doc.setFontSize(9);
      doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 60);
      
      const tableColumn = ['ID', 'Usuario', 'Monto', 'Tasa', 'Plazo', 'Cuota Fija', 'Ahorro', 'Fecha'];
      const tableRows = simulaciones.map(sim => [
        sim.id,
        sim.usuario_nombre || sim.usuario_id || '-',
        sim.capital_actual ? sim.capital_actual.toLocaleString('es-ES') : '0',
        sim.tasa_actual || '0',
        sim.plazo_actual ? `${sim.plazo_actual} meses` : '-',
        sim.cuota_redondeada ? sim.cuota_redondeada.toLocaleString('es-ES') : '0',
        sim.ahorro_total ? sim.ahorro_total.toLocaleString('es-ES') : '0',
        new Date(sim.fecha_simulacion).toLocaleDateString()
      ]);
      
      if (autoTable) {
        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 80,
          theme: 'striped',
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [27, 94, 32], textColor: 255 }
        });
      } else {
        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 80,
          theme: 'striped',
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [27, 94, 32], textColor: 255 }
        });
      }
      
      doc.save(`simulaciones_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF generado');
    } catch (error) {
      console.error(error);
      toast.error('Error al generar PDF');
    }
  };

  const crearUsuario = async (e) => {
    e.preventDefault();
    if (!nuevoUsuario.password) {
      toast.error('Ingrese una contraseña');
      return;
    }
    try {
      await axios.post(`${API_URL}/admin/usuarios`, nuevoUsuario);
      toast.success('Usuario creado');
      setShowModal(false);
      setNuevoUsuario({ nombre: '', email: '', telefono: '', password: '', rol: 'usuario' });
      cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear usuario');
    }
  };

  const eliminarUsuario = async (id, nombre) => {
    if (window.confirm(`¿Eliminar a "${nombre}"?`)) {
      try {
        await axios.delete(`${API_URL}/admin/usuarios/${id}`);
        toast.success('Usuario eliminado');
        cargarDatos();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al eliminar');
      }
    }
  };

  const actualizarRol = async (id, rol) => {
    try {
      await axios.put(`${API_URL}/admin/usuarios/${id}`, { rol });
      toast.success('Rol actualizado');
      cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    }
  };

  const actualizarEstadoRegistro = async (id, estado) => {
    try {
      await axios.put(`${API_URL}/admin/registros-interes/${id}/estado`, { estado });
      toast.success('Estado actualizado');
      cargarDatos();
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatMoney = (value) => {
    if (!value) return '0.00';
    return value.toLocaleString('es-ES', { minimumFractionDigits: 2 });
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES');
  };

  if (loading) {
    return <div className="admin-container"><div className="admin-main">Cargando datos...</div></div>;
  }

  if (!usuario || usuario.rol !== 'admin') {
    return <div className="admin-container"><div className="admin-main">Verificando permisos...</div></div>;
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="logo-area">
          <div className="logo-circle">SC</div>
          <div>
            <h1>Societaria Cantera R.L.</h1>
            <p>Panel de Administración</p>
          </div>
        </div>
        <div className="user-info">
          <span> Admin: {usuario?.nombre}</span>
          <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
        </div>
      </header>

      <div className="admin-main">
        <div className="stats-grid">
          <div className="stat-card"><div className="number">{usuarios.length}</div><div className="label">Usuarios</div></div>
          <div className="stat-card"><div className="number">{registrosInteres.length}</div><div className="label">Solicitudes</div></div>
          <div className="stat-card"><div className="number">{simulaciones.length}</div><div className="label">Simulaciones</div></div>
        </div>

        <div className="admin-tabs">
          <button className={`tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`} onClick={() => setActiveTab('usuarios')}>👥 Usuarios ({usuarios.length})</button>
          <button className={`tab-btn ${activeTab === 'solicitudes' ? 'active' : ''}`} onClick={() => setActiveTab('solicitudes')}>📞 Solicitudes ({registrosInteres.length})</button>
          <button className={`tab-btn ${activeTab === 'simulaciones' ? 'active' : ''}`} onClick={() => setActiveTab('simulaciones')}>📊 Simulaciones ({simulaciones.length})</button>
        </div>

        {activeTab === 'usuarios' && (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>👥 Usuarios Registrados</h3>
              <button className="btn-primary" onClick={() => setShowModal(true)}>➕ Nuevo Usuario</button>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Rol</th><th>Estado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.nombre}</td>
                      <td>{user.email}</td>
                      <td>{user.telefono || '-'}</td>
                      <td>
                        {user.id === usuario?.id ? (
                          <span className="badge-admin"> Administrador</span>
                        ) : (
                          <select value={user.rol} onChange={(e) => actualizarRol(user.id, e.target.value)} className="rol-select">
                            <option value="usuario"> Usuario</option>
                            <option value="admin"> Administrador</option>
                          </select>
                        )}
                      </td>
                      <td>{user.activo ? '✅ Activo' : '❌ Inactivo'}</td>
                      <td><button className="btn-delete" onClick={() => eliminarUsuario(user.id, user.nombre)}>🗑️ Eliminar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'solicitudes' && (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <h3>📞 Solicitudes de Crédito</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="date-input" />
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="date-input" />
                <input type="text" value={nombreBuscar} onChange={(e) => setNombreBuscar(e.target.value)} className="date-input" placeholder="Buscar por nombre" />
                <button className="btn-search" onClick={buscarRegistros}>🔍 Buscar</button>
                {filtroActivo && <button className="btn-clear" onClick={limpiarFiltro}>🗑️ Limpiar</button>}
                <button className="btn-download" onClick={descargarReportePDF}>📥 Descargar PDF</button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Monto</th><th>Plazo</th><th>Estado</th><th>Registrado por</th><th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosInteres.map(reg => (
                    <tr key={reg.id}>
                      <td>{reg.id}</td>
                      <td>{reg.nombre_completo}</td>
                      <td>{reg.email}</td>
                      <td>{reg.telefono || '-'}</td>
                      <td>Bs {formatMoney(reg.monto_interes)}</td>
                      <td>{reg.plazo_interes || '-'} meses</td>
                      <td>
                        <select 
                          value={reg.estado || 'pendiente'} 
                          onChange={(e) => actualizarEstadoRegistro(reg.id, e.target.value)}
                          className={`estado-select ${reg.estado || 'pendiente'}`}
                        >
                          <option value="pendiente">⏳ Pendiente</option>
                          <option value="contactado">📞 Contactado</option>
                          <option value="aprobado">✅ Aprobado</option>
                          <option value="rechazado">❌ Rechazado</option>
                        </select>
                      </td>
                      <td>{reg.usuario_registro || 'Usuario web'}</td>
                      <td>{formatDate(reg.fecha_registro)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'simulaciones' && (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>📊 Historial de Simulaciones</h3>
              <button className="btn-download" onClick={generarPDFSimulaciones}>📥 Descargar PDF</button>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Usuario</th><th>Monto</th><th>Tasa</th><th>Plazo</th><th>Cuota Fija</th><th>Ahorro</th><th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {simulaciones.map(sim => (
                    <tr key={sim.id}>
                      <td>{sim.id}</td>
                      <td>{sim.usuario_nombre || sim.usuario_id || '-'}</td>
                      <td>Bs {formatMoney(sim.capital_actual)}</td>
                      <td>{sim.tasa_actual}%</td>
                      <td>{sim.plazo_actual} meses</td>
                      <td><strong>Bs {formatMoney(sim.cuota_redondeada)}</strong></td>
                      <td>Bs {formatMoney(sim.ahorro_total)}</td>
                      <td>{formatDate(sim.fecha_simulacion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setNuevoUsuario({ nombre: '', email: '', telefono: '', password: '', rol: 'usuario' }); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>➕ Nuevo Usuario</h3>
            <form onSubmit={crearUsuario}>
              <input type="text" placeholder="Nombre" required value={nuevoUsuario.nombre} onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} />
              <input type="email" placeholder="Email" required value={nuevoUsuario.email} onChange={(e) => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} />
              <input type="tel" placeholder="Teléfono" value={nuevoUsuario.telefono} onChange={(e) => setNuevoUsuario({...nuevoUsuario, telefono: e.target.value})} />
              <input type="password" placeholder="Contraseña" required value={nuevoUsuario.password} onChange={(e) => setNuevoUsuario({...nuevoUsuario, password: e.target.value})} />
              <select value={nuevoUsuario.rol} onChange={(e) => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})}>
                <option value="usuario"> Usuario</option>
                <option value="admin"> Administrador</option>
              </select>
              <div className="modal-buttons">
                <button type="button" className="btn-cancel" onClick={() => { setShowModal(false); setNuevoUsuario({ nombre: '', email: '', telefono: '', password: '', rol: 'usuario' }); }}>Cancelar</button>
                <button type="submit" className="btn-save">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;