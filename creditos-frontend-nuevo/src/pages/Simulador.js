import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './Simulador.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://sistema-creditos-backend.vercel.app/api';

export default function Simulador() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombreSocio: '',
    capital: '',
    tasa: '',
    plazo: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaPrimerPago: ''
  });
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editandoCuota, setEditandoCuota] = useState(false);
  const [cuotaEditada, setCuotaEditada] = useState('');
  const cotizacionRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const calcularFechaSugerida = (fechaInicio) => {
    const fecha = new Date(fechaInicio);
    return new Date(fecha.getFullYear(), fecha.getMonth() + 2, 10);
  };

  const handleFechaInicioChange = (e) => {
    const nuevaFecha = e.target.value;
    const fechaSugerida = calcularFechaSugerida(nuevaFecha);
    const fechaSugeridaStr = fechaSugerida.toISOString().split('T')[0];
    setForm({
      ...form,
      fechaInicio: nuevaFecha,
      fechaPrimerPago: fechaSugeridaStr
    });
  };

  const handleSimular = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      const res = await axios.post(`${API_URL}/credito/simular`, {
        capital: parseFloat(form.capital),
        tasa: parseFloat(form.tasa),
        plazo: parseInt(form.plazo),
        fechaInicio: form.fechaInicio,
        fechaPrimerPago: form.fechaPrimerPago || null
      });
      setResultado(res.data);
      setCuotaEditada(res.data.cuotaRedondeada.toString());
      setMostrarResultados(true);
      setEditandoCuota(false);
      toast.success('Simulación completada');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al simular');
    } finally {
      setCargando(false);
    }
  };

  const recalcularConCuotaEditada = async () => {
    if (!cuotaEditada || parseFloat(cuotaEditada) <= 0) {
      toast.error('Ingrese una cuota válida');
      return;
    }

    setCargando(true);
    try {
      const res = await axios.post(`${API_URL}/credito/simular-con-cuota`, {
        capital: parseFloat(form.capital),
        tasa: parseFloat(form.tasa),
        plazo: parseInt(form.plazo),
        fechaInicio: form.fechaInicio,
        fechaPrimerPago: form.fechaPrimerPago || null,
        cuotaFija: parseFloat(cuotaEditada)
      });
      setResultado(res.data);
      toast.success('Cuota actualizada y recalculada');
      setEditandoCuota(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al recalcular');
    } finally {
      setCargando(false);
    }
  };

  const handleGuardarInteres = async () => {
    if (!form.nombreSocio.trim()) {
      toast.error('Por favor ingrese el nombre del socio');
      return;
    }
    setGuardando(true);
    try {
      await axios.post(`${API_URL}/credito/registrar-interes`, {
        nombre: form.nombreSocio,
        email: usuario?.email || '',
        telefono: '',
        monto: parseFloat(form.capital),
        plazo: parseInt(form.plazo)
      });
      toast.success('✅ Registrado Correctamente');
    } catch (error) {
      toast.error('Error al guardar el registro');
    } finally {
      setGuardando(false);
    }
  };

  const formatMoney = (value) => {
    if (value === undefined || value === null) return '0.00';
    return value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // FUNCIÓN PDF MODIFICADA - TAMAÑO CARTA, VERTICAL, SIN TASA
  const generarPDF = () => {
    if (!resultado) return;
    
    try {
      // Configurar documento en tamaño CARTA (Letter = 8.5" x 11") y vertical
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
      });
      
      // Colores de la cooperativa
      const coopGreen = [27, 94, 32];
      const coopGold = [212, 175, 55];
      
      // ========== ENCABEZADO ==========
      doc.setFillColor(...coopGreen);
      doc.rect(0, 0, 215.9, 35, 'F'); // 215.9mm = ancho carta
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('CANTERA R.L.', 107.95, 18, { align: 'center' });
      doc.setFontSize(9);
      doc.text('Cooperativa de Ahorro y Crédito Societaria', 107.95, 27, { align: 'center' });
      
      // ========== TÍTULO ==========
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(13);
      doc.text('COTIZACIÓN DE CRÉDITO', 107.95, 48, { align: 'center' });
      
      // ========== DATOS DEL CLIENTE ==========
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 62);
      doc.text(`Solicitante: ${form.nombreSocio}`, 20, 72);
      
      // Cuadro resumen (solo datos necesarios, SIN TASA)
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(20, 82, 175.9, 35, 3, 3, 'F');
      doc.setDrawColor(...coopGold);
      doc.setLineWidth(0.5);
      doc.roundedRect(20, 82, 175.9, 35, 3, 3, 'D');
      
      doc.setFontSize(9);
      doc.setTextColor(...coopGreen);
      doc.setFont(undefined, 'bold');
      doc.text('RESUMEN DEL CRÉDITO', 107.95, 92, { align: 'center' });
      
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      // Primera fila
      doc.text(`Monto: Bs ${formatMoney(parseFloat(form.capital))}`, 30, 103);
      doc.text(`Plazo: ${form.plazo} meses`, 110, 103);
      // Segunda fila
      doc.text(`Cuota Fija: Bs ${formatMoney(resultado.cuotaRedondeada)}`, 30, 112);
      doc.text(`Ahorro Total: Bs ${formatMoney(resultado.ahorroTotal)}`, 110, 112);
      
      // ========== TABLA DE AMORTIZACIÓN ==========
      const tableColumn = ['N°', 'Fecha', 'Capital', 'Interés', 'Seguro', 'Total Real', 'Ahorro', 'Cuota', 'Saldo'];
      const tableRows = resultado.cuotas.map(cuota => [
        cuota.cuota,
        formatDate(cuota.fecha),
        `Bs ${formatMoney(cuota.capital)}`,
        `Bs ${formatMoney(cuota.interes)}`,
        `Bs ${formatMoney(cuota.cargos)}`,
        `Bs ${formatMoney(cuota.totalReal)}`,
        `Bs ${formatMoney(cuota.ahorro)}`,
        `Bs ${formatMoney(cuota.cuotaTotal)}`,
        `Bs ${formatMoney(cuota.saldo)}`
      ]);
      
      // Calcular totales
      const totalCapital = resultado.cuotas.reduce((s, c) => s + (c.capital || 0), 0);
      const totalInteres = resultado.cuotas.reduce((s, c) => s + (c.interes || 0), 0);
      const totalSeguro = resultado.cuotas.reduce((s, c) => s + (c.cargos || 0), 0);
      
      tableRows.push([
        'TOTALES',
        '',
        `Bs ${formatMoney(totalCapital)}`,
        `Bs ${formatMoney(totalInteres)}`,
        `Bs ${formatMoney(totalSeguro)}`,
        '',
        `Bs ${formatMoney(resultado.ahorroTotal)}`,
        '',
        ''
      ]);
      
      // Generar tabla con ajuste automático
      doc.autoTable({
        startY: 125,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { 
          fillColor: coopGreen, 
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: { 
          fontSize: 7, 
          cellPadding: 2,
          halign: 'right'
        },
        columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'center' }
        },
        footStyles: {
          fillColor: [245, 245, 245],
          textColor: 0,
          fontStyle: 'bold'
        },
        margin: { left: 15, right: 15 },
        tableWidth: 'auto'
      });
      
      // ========== PIE DE PÁGINA (en cada página) ==========
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const currentPageHeight = doc.internal.pageSize.getHeight();
        
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text('Esta cotización es una simulación. La tasa está sujeta a evaluación crediticia.', 107.95, currentPageHeight - 12, { align: 'center' });
        doc.text('Cooperativa de Ahorro y Crédito Cantera R.L.', 107.95, currentPageHeight - 6, { align: 'center' });
        
        // Número de página
        doc.text(`Página ${i} de ${pageCount}`, 200, currentPageHeight - 6, { align: 'right' });
      }
      
      // Guardar el PDF
      doc.save(`cotizacion_${form.nombreSocio.replace(/\s/g, '_')}.pdf`);
      toast.success('PDF descargado');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar PDF');
    }
  };

  const handleNuevo = () => {
    setMostrarResultados(false);
    setResultado(null);
    setEditandoCuota(false);
    setForm({
      nombreSocio: '',
      capital: '',
      tasa: '',
      plazo: '',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaPrimerPago: ''
    });
  };

  return (
    <div>
      <header className="coop-header">
        <div className="header-container">
          <div className="logo-area">
            <img src="/logo.png" alt="Societaria Cantera" className="logo-header" />
            <div className="coop-name">
              <h1>CANTERA R.L.</h1>
              <p>Cooperativa de Ahorro y Crédito Societaria</p>
            </div>
          </div>
          <div className="user-info">
            <span className="user-name">Bienvenid@ {usuario?.nombre}</span>
            {usuario?.rol === 'admin' && (
              <Link to="/admin" className="btn-admin">Panel De Control</Link>
            )}
            <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
          </div>
        </div>
      </header>

      <div className="main-container">
        {!mostrarResultados ? (
          <div className="form-card">
            <div className="card-header">
              <h2>SIMULADOR DE CRÉDITOS</h2>
              <p>Complete los datos para obtener una cotización</p>
            </div>
            <form onSubmit={handleSimular}>
              <div className="card-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>NOMBRE DEL SOCIO / INTERESADO *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Juan Pérez"
                      value={form.nombreSocio}
                      onChange={(e) => setForm({...form, nombreSocio: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>MONTO DEL CRÉDITO (Bs)</label>
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      value={form.capital}
                      onChange={(e) => setForm({...form, capital: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>FECHA DE DESEMBOLSO</label>
                    <input
                      type="date"
                      required
                      value={form.fechaInicio}
                      onChange={handleFechaInicioChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>FECHA PRIMER PAGO (Opcional)</label>
                    <input
                      type="date"
                      value={form.fechaPrimerPago}
                      onChange={(e) => setForm({...form, fechaPrimerPago: e.target.value})}
                    />
                    <small>Dejar vacío para calcular automáticamente</small>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>TASA DE INTERÉS (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={form.tasa}
                      onChange={(e) => setForm({...form, tasa: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>⏱️ PLAZO (MESES)</label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={form.plazo}
                      onChange={(e) => setForm({...form, plazo: e.target.value})}
                    />
                  </div>
                </div>
                <button type="submit" disabled={cargando} className="btn-simular">
                  {cargando ? 'CALCULANDO...' : 'SIMULAR CRÉDITO'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div ref={cotizacionRef}>
            <div className="card">
              <div className="card-header">
                <h3>DATOS DEL CRÉDITO</h3>
              </div>
              <div className="card-body">
                <div className="summary-grid">
                  <div className="info-item"><span className="info-label">Solicitante:</span><span className="info-value">{form.nombreSocio}</span></div>
                  <div className="info-item"><span className="info-label">Monto:</span><span className="info-value">Bs {formatMoney(parseFloat(form.capital))}</span></div>
                  <div className="info-item"><span className="info-label">Tasa:</span><span className="info-value">{form.tasa}%</span></div>
                  <div className="info-item"><span className="info-label">Plazo:</span><span className="info-value">{form.plazo} meses</span></div>
                  <div className="info-item"><span className="info-label">Cuota Fija:</span>
                    <span className="info-value">
                      {editandoCuota ? (
                        <input
                          type="number"
                          value={cuotaEditada}
                          onChange={(e) => setCuotaEditada(e.target.value)}
                          style={{ width: '120px', padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
                        />
                      ) : (
                        `Bs ${formatMoney(resultado.cuotaRedondeada)}`
                      )}
                    </span>
                  </div>
                  <div className="info-item"><span className="info-label">Ahorro Total:</span><span className="info-value text-success">Bs {formatMoney(resultado.ahorroTotal)}</span></div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  {!editandoCuota ? (
                    <button className="btn-nuevo" onClick={() => setEditandoCuota(true)}>EDITAR CUOTA</button>
                  ) : (
                    <>
                      <button className="btn-guardar" onClick={recalcularConCuotaEditada}>GUARDAR CAMBIOS</button>
                      <button className="btn-cancelar" onClick={() => { setEditandoCuota(false); setCuotaEditada(resultado.cuotaRedondeada.toString()); }}>❌ CANCELAR</button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h3>TABLA DE AMORTIZACIÓN</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button onClick={handleGuardarInteres} disabled={guardando} className="btn-guardar">
                    {guardando ? 'GUARDANDO...' : 'REGISTRAR INTERÉS'}
                  </button>
                  <button onClick={handleNuevo} className="btn-nuevo">NUEVA SIMULACIÓN</button>
                  <button onClick={generarPDF} className="btn-pdf">DESCARGAR</button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>N°</th><th>Fecha</th><th>Capital</th><th>Interés</th>
                        <th>Seguro</th><th>Total Real</th><th>Ahorro</th><th>Cuota Fija</th><th>Saldo</th>
                       </tr>
                    </thead>
                    <tbody>
                      <tr className="row-inicial">
                        <td style={{ textAlign: 'center' }}>0</td>
                        <td style={{ textAlign: 'center' }}>{formatDate(form.fechaInicio)}</td>
                        <td style={{ textAlign: 'right' }}>-</td>
                        <td style={{ textAlign: 'right' }}>-</td>
                        <td style={{ textAlign: 'right' }}>-</td>
                        <td style={{ textAlign: 'right' }}>-</td>
                        <td style={{ textAlign: 'right' }}>-</td>
                        <td style={{ textAlign: 'right' }}>-</td>
                        <td style={{ textAlign: 'right' }}><strong>Bs {formatMoney(parseFloat(form.capital))}</strong></td>
                      </tr>
                      {resultado.cuotas && resultado.cuotas.map((cuota, idx) => (
                        <tr key={idx}>
                          <td style={{ textAlign: 'center' }}>{cuota.cuota}</td>
                          <td style={{ textAlign: 'center' }}>{formatDate(cuota.fecha)}</td>
                          <td style={{ textAlign: 'right' }}>Bs {formatMoney(cuota.capital)}</td>
                          <td style={{ textAlign: 'right' }}>Bs {formatMoney(cuota.interes)}</td>
                          <td style={{ textAlign: 'right' }}>Bs {formatMoney(cuota.cargos)}</td>
                          <td style={{ textAlign: 'right' }}>Bs {formatMoney(cuota.totalReal)}</td>
                          <td style={{ textAlign: 'right', color: '#2E7D32', fontWeight: 'bold' }}>Bs {formatMoney(cuota.ahorro)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#1B5E20' }}>Bs {formatMoney(cuota.cuotaTotal)}</td>
                          <td style={{ textAlign: 'right' }}>Bs {formatMoney(cuota.saldo)}</td>
                        </tr>
                      ))}
                      <tr className="row-total">
                        <td colSpan="2"><strong>TOTALES</strong></td>
                        <td style={{ textAlign: 'right' }}><strong>Bs {formatMoney(resultado.cuotas.reduce((s,c)=>s+(c.capital||0),0))}</strong></td>
                        <td style={{ textAlign: 'right' }}><strong>Bs {formatMoney(resultado.cuotas.reduce((s,c)=>s+(c.interes||0),0))}</strong></td>
                        <td style={{ textAlign: 'right' }}><strong>Bs {formatMoney(resultado.cuotas.reduce((s,c)=>s+(c.cargos||0),0))}</strong></td>
                        <td style={{ textAlign: 'right' }}>-</td>
                        <td style={{ textAlign: 'right', color: '#2E7D32' }}><strong>Bs {formatMoney(resultado.ahorroTotal)}</strong></td>
                        <td style={{ textAlign: 'right' }}>-</td>
                        <td style={{ textAlign: 'right' }}>-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}