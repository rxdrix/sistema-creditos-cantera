const { pool } = require('../config/database');

const calcularSimulacion = (capital, tasa, plazo, fechaInicio) => {
  const TasaSeguro = 0.0009;
  const fechaInicioDate = new Date(fechaInicio);
  const fechaPrimerPago = new Date(fechaInicioDate.getFullYear(), fechaInicioDate.getMonth() + 2, 10);
  const diasPrimerPago = Math.round((fechaPrimerPago - fechaInicioDate) / (1000 * 60 * 60 * 24));
  const capitalCuotaBase = capital / plazo;
  const interesPrimera = (capital * tasa * diasPrimerPago) / 36000;
  const cargoPrimera = capital * TasaSeguro;
  const cuotaRealPrimera = capitalCuotaBase + interesPrimera + cargoPrimera;
  const cuotaRedondeada = Math.ceil(cuotaRealPrimera / 50) * 50;
  
  let saldo = capital;
  let ahorroTotal = 0;
  const cuotas = [];
  let fechaAnterior = fechaInicioDate;
  let fechaPago = fechaPrimerPago;
  
  for (let i = 1; i <= plazo; i++) {
    if (i > 1) {
      fechaPago = new Date(fechaPago.getFullYear(), fechaPago.getMonth() + 1, 10);
    }
    const dias = Math.round((fechaPago - fechaAnterior) / (1000 * 60 * 60 * 24));
    const interes = (saldo * tasa * dias) / 36000;
    const interesRedondeado = Math.round(interes * 100) / 100;
    const cargoSeguro = saldo * TasaSeguro;
    const cargoRedondeado = Math.round(cargoSeguro * 100) / 100;
    let capitalCuota;
    if (i === plazo) {
      capitalCuota = Math.round(saldo * 100) / 100;
    } else {
      capitalCuota = Math.round(capitalCuotaBase * 100) / 100;
    }
    const totalPagarReal = capitalCuota + interesRedondeado + cargoRedondeado;
    const totalPagarRealRedondeado = Math.round(totalPagarReal * 100) / 100;
    let ahorro = cuotaRedondeada - totalPagarRealRedondeado;
    if (ahorro < 0) ahorro = 0;
    ahorro = Math.round(ahorro * 100) / 100;
    ahorroTotal += ahorro;
    saldo = saldo - capitalCuota;
    if (saldo < 0) saldo = 0;
    saldo = Math.round(saldo * 100) / 100;
    
    cuotas.push({
      cuota: i,
      fecha: fechaPago,
      capital: capitalCuota,
      interes: interesRedondeado,
      cargos: cargoRedondeado,
      totalReal: totalPagarRealRedondeado,
      ahorro: ahorro,
      cuotaTotal: cuotaRedondeada,
      saldo: saldo
    });
    fechaAnterior = fechaPago;
  }
  
  ahorroTotal = Math.round(ahorroTotal * 100) / 100;
  
  return {
    cuotaRedondeada,
    ahorroTotal: ahorroTotal,
    cuotaRealPrimera: Math.round(cuotaRealPrimera * 100) / 100,
    cuotas
  };
};

const simularCredito = async (req, res) => {
  try {
    const { capital, tasa, plazo, fechaInicio } = req.body;
    const usuarioId = req.usuario.id;
    
    if (!capital || !tasa || !plazo) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }
    
    const resultado = calcularSimulacion(capital, tasa, plazo, fechaInicio || new Date());
    
    const query = `
      INSERT INTO simulaciones (usuario_id, capital_actual, tasa_actual, plazo_actual, 
                                cuota_redondeada, ahorro_total, cuota_real_primera, detalles_simulacion)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;
    
    const values = [
      usuarioId, capital, tasa, plazo,
      resultado.cuotaRedondeada, resultado.ahorroTotal, resultado.cuotaRealPrimera,
      JSON.stringify(resultado.cuotas)
    ];
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      simulacionId: result.rows[0].id,
      cuotaRedondeada: resultado.cuotaRedondeada,
      ahorroTotal: resultado.ahorroTotal,
      cuotaRealPrimera: resultado.cuotaRealPrimera,
      cuotas: resultado.cuotas
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const getHistorialSimulaciones = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const query = `
      SELECT id, fecha_simulacion, capital_actual, tasa_actual, plazo_actual,
             cuota_redondeada, ahorro_total
      FROM simulaciones
      WHERE usuario_id = $1
      ORDER BY fecha_simulacion DESC
    `;
    const result = await pool.query(query, [usuarioId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const registrarInteres = async (req, res) => {
  try {
    const { nombre, email, telefono, monto, plazo } = req.body;
    const usuarioId = req.usuario.id;
    const query = `
      INSERT INTO registros_interes (usuario_id, nombre_completo, email, telefono, monto_interes, plazo_interes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const values = [usuarioId, nombre, email, telefono, monto || null, plazo || null];
    const result = await pool.query(query, values);
    res.json({ success: true, message: 'Registro guardado', registroId: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { simularCredito, getHistorialSimulaciones, registrarInteres };