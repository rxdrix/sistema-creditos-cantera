import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import './Simulador.css';

// Importar jspdf correctamente
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = 'http://localhost:5000/api';

export default function Simulador() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombreSocio: '',
    capital: '',
    tasa: '',
    plazo: '',
    fechaInicio: new Date().toISOString().split('T')[0]
  });
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const cotizacionRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSimular = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      const res = await axios.post(`${API_URL}/credito/simular`, {
        capital: parseFloat(form.capital),
        tasa: parseFloat(form.tasa),
        plazo: parseInt(form.plazo),
        fechaInicio: form.fechaInicio
      });
      setResultado(res.data);
      setMostrarResultados(true);
      toast.success('Simulación completada');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al simular');
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

  const generarPDF = () => {
    if (!resultado) {
      toast.error('No hay resultados para generar PDF');
      return;
    }

    try {
      // Crear documento PDF en formato landscape
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Header - Verde cooperativo
      doc.setFillColor(27, 94, 32);
      doc.rect(0, 0, 297, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('CANTERA R.L.', 148.5, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text('Cooperativa de Ahorro y Crédito', 148.5, 30, { align: 'center' });
      
      // Título
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text('COTIZACIÓN DE CRÉDITO', 148.5, 50, { align: 'center' });
      
      // Datos del crédito
      doc.setFontSize(10);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 65);
      doc.text(`Solicitante: ${form.nombreSocio}`, 20, 75);
      doc.text(`Monto: Bs ${formatMoney(parseFloat(form.capital))}`, 20, 85);
      doc.text(`Tasa: ${form.tasa}%`, 20, 95);
      doc.text(`Plazo: ${form.plazo} meses`, 20, 105);
      doc.text(`Cuota Fija: Bs ${formatMoney(resultado.cuotaRedondeada)}`, 150, 75);
      doc.text(`Ahorro Total: Bs ${formatMoney(resultado.ahorroTotal)}`, 150, 85);
      doc.text(`Total a Pagar: Bs ${formatMoney(resultado.cuotaRedondeada * form.plazo)}`, 150, 95);
      
      // Preparar datos para la tabla
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
      
      // Agregar tabla usando autoTable (importada correctamente)
      autoTable(doc, {
        startY: 115,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: {
          fillColor: [27, 94, 32],
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 25, halign: 'right' },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 25, halign: 'right' },
          6: { cellWidth: 25, halign: 'right' },
          7: { cellWidth: 25, halign: 'right' },
          8: { cellWidth: 30, halign: 'right' }
        }
      });
      
      // Footer
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Esta cotización es una simulación. La tasa está sujeta a evaluación crediticia.', 148.5, finalY, { align: 'center' });
      doc.text('               Cantera R.L.                  "', 148.5, finalY + 7, { align: 'center' });
      
      // Guardar PDF
      const nombreArchivo = `cotizacion_${form.nombreSocio.replace(/\s/g, '_')}.pdf`;
      doc.save(nombreArchivo);
      toast.success('PDF descargado correctamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar PDF: ' + error.message);
    }
  };

  const handleNuevo = () => {
    setMostrarResultados(false);
    setResultado(null);
    setForm({
      nombreSocio: '',
      capital: '',
      tasa: '',
      plazo: '',
      fechaInicio: new Date().toISOString().split('T')[0]
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
              <p>Cooperativa de Ahorro y Crédito</p>
            </div>
          </div>
          <div className="user-info">
            <span className="user-name">Bienvenido {usuario?.nombre}</span>
            {usuario?.rol === 'admin' && (
              <Link to="/admin" className="btn-admin">
                 Panel De Control
              </Link>
            )}
            <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
          </div>
        </div>
      </header>

      <div className="main-container">
        {!mostrarResultados ? (
          <div className="form-card">
            <div className="card-header">
              <h2> SIMULADOR DE CRÉDITOS</h2>
              <p>Complete los datos para obtener una cotización</p>
            </div>
            <form onSubmit={handleSimular}>
              <div className="card-body">
                <div className="form-row">
                  <div className="form-group">
                    <label> NOMBRE DEL SOCIO / INTERESADO *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Juan Pérez Mamani"
                      value={form.nombreSocio}
                      onChange={(e) => setForm({...form, nombreSocio: e.target.value})}
                    />
                    <small style={{ fontSize: '0.7rem', color: '#666' }}>Nombre completo del solicitante</small>
                  </div>
                  <div className="form-group">
                    <label> MONTO DEL CRÉDITO (BOB)</label>
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
                    <label> FECHA DE DESEMBOLSO</label>
                    <input
                      type="date"
                      required
                      value={form.fechaInicio}
                      onChange={(e) => setForm({...form, fechaInicio: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label> TASA DE INTERÉS (%)</label>
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
                  {cargando ? '🔄 CALCULANDO...' : ' SIMULAR CRÉDITO'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div ref={cotizacionRef}>
            <div className="card">
              <div className="card-header">
                <h3>📋 DATOS DEL CRÉDITO</h3>
              </div>
              <div className="card-body">
                <div className="summary-grid">
                  <div className="info-item">
                    <span className="info-label">Solicitante:</span>
                    <span className="info-value">{form.nombreSocio}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Monto:</span>
                    <span className="info-value">Bs {formatMoney(parseFloat(form.capital))}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Tasa:</span>
                    <span className="info-value">{form.tasa}%</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Plazo:</span>
                    <span className="info-value">{form.plazo} meses</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Cuota Fija:</span>
                    <span className="info-value">Bs {formatMoney(resultado.cuotaRedondeada)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Ahorro Total:</span>
                    <span className="info-value text-success">Bs {formatMoney(resultado.ahorroTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h3>📊 TABLA DE AMORTIZACIÓN</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleGuardarInteres} disabled={guardando} className="btn-guardar">
                    {guardando ? ' GUARDANDO...' : ' REGISTRAR INTERÉS'}
                  </button>
                  <button onClick={handleNuevo} className="btn-nuevo">
                     NUEVA SIMULACIÓN
                  </button>
                  <button onClick={generarPDF} className="btn-pdf">
                     DESCARGAR PDF
                  </button>
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
                        <td>0</td><td>{formatDate(form.fechaInicio)}</td>
                        <td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td>
                        <td><strong>Bs {formatMoney(parseFloat(form.capital))}</strong></td>
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