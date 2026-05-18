const { pool } = require('../config/database');

// Función para sumar meses correctamente
const sumarMeses = (fecha, meses) => {
  const nuevaFecha = new Date(fecha);
  const diaOriginal = nuevaFecha.getDate();
  nuevaFecha.setMonth(nuevaFecha.getMonth() + meses);
  
  // Si el día cambió (ej: 31 de enero -> 3 de marzo), ajustar al último día del mes
  if (nuevaFecha.getDate() !== diaOriginal) {
    nuevaFecha.setDate(0); // Último día del mes anterior
  }
  
  return nuevaFecha;
};

// Función principal de simulación
const calcularSimulacion = (capital, tasa, plazo, fechaInicio, fechaPrimerPagoCustom = null) => {
  const TasaSeguro = 0.0009;
  const fechaInicioDate = new Date(fechaInicio);
  
  // Determinar fecha de primer pago (custom o automática - 10 del mes siguiente al siguiente)
  let fechaPrimerPago;
  if (fechaPrimerPagoCustom) {
    fechaPrimerPago = new Date(fechaPrimerPagoCustom);
    // Asegurar que la fecha mantenga el día exacto (ej: 5 de julio)
    fechaPrimerPago.setHours(0, 0, 0, 0);
  } else {
    fechaPrimerPago = new Date(fechaInicioDate.getFullYear(), fechaInicioDate.getMonth() + 2, 10);
  }
  
  // Guardar el día de pago para usarlo en todas las cuotas
  const diaPago = fechaPrimerPago.getDate();
  
  // Días reales primera cuota
  const diasPrimerPago = Math.round((fechaPrimerPago - fechaInicioDate) / (1000 * 60 * 60 * 24));
  
  // Capital por cuota (constante)
  const capitalCuotaBase = capital / plazo;
  
  // Interés primera cuota (días reales)
  const interesPrimera = (capital * tasa * diasPrimerPago) / 36000;
  
  // Cargo seguro primera cuota
  const cargoPrimera = capital * TasaSeguro;
  
  // Total real primera cuota
  const cuotaRealPrimera = capitalCuotaBase + interesPrimera + cargoPrimera;
  
  // Redondear hacia arriba múltiplo de 50
  const cuotaRedondeada = Math.ceil(cuotaRealPrimera / 50) * 50;
  
  // Generar detalle de cuotas
  let saldo = capital;
  let ahorroTotal = 0;
  let totalCapital = 0;
  let totalInteres = 0;
  let totalSeguro = 0;
  const cuotas = [];
  let fechaAnterior = fechaInicioDate;
  let fechaPago = fechaPrimerPago;
  
  for (let i = 1; i <= plazo; i++) {
    if (i > 1) {
      // Sumar un mes manteniendo el mismo día (ej: 5 de julio -> 5 de agosto)
      fechaPago = sumarMeses(fechaPago, 1);
    }
    
    // Calcular días reales entre fecha anterior y fecha de pago
    const dias = Math.round((fechaPago - fechaAnterior) / (1000 * 60 * 60 * 24));
    
    // Interés sobre saldo actual con días reales
    const interes = (saldo * tasa * dias) / 36000;
    const interesRedondeado = Math.round(interes * 100) / 100;
    
    // Cargo seguro
    const cargoSeguro = saldo * TasaSeguro;
    const cargoRedondeado = Math.round(cargoSeguro * 100) / 100;
    
    // Capital de la cuota
    let capitalCuota;
    if (i === plazo) {
      capitalCuota = Math.round(saldo * 100) / 100;
    } else {
      capitalCuota = Math.round(capitalCuotaBase * 100) / 100;
    }
    
    // Total real a pagar
    const totalPagarReal = capitalCuota + interesRedondeado + cargoRedondeado;
    const totalPagarRealRedondeado = Math.round(totalPagarReal * 100) / 100;
    
    // Ahorro de esta cuota
    let ahorro = cuotaRedondeada - totalPagarRealRedondeado;
    if (ahorro < 0) ahorro = 0;
    ahorro = Math.round(ahorro * 100) / 100;
    
    // Acumular totales
    totalCapital += capitalCuota;
    totalInteres += interesRedondeado;
    totalSeguro += cargoRedondeado;
    ahorroTotal += ahorro;
    
    // Actualizar saldo
    saldo = saldo - capitalCuota;
    if (saldo < 0) saldo = 0;
    saldo = Math.round(saldo * 100) / 100;
    
    // Guardar cuota
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
  
  return {
    cuotaRedondeada,
    ahorroTotal: Math.round(ahorroTotal * 100) / 100,
    cuotaRealPrimera: Math.round(cuotaRealPrimera * 100) / 100,
    totalCapital: Math.round(totalCapital * 100) / 100,
    totalInteres: Math.round(totalInteres * 100) / 100,
    totalSeguro: Math.round(totalSeguro * 100) / 100,
    cuotas
  };
};

// Simular crédito con cuota fija personalizada
const calcularSimulacionConCuotaFija = (capital, tasa, plazo, fechaInicio, fechaPrimerPagoCustom, cuotaFija) => {
  const TasaSeguro = 0.0009;
  const fechaInicioDate = new Date(fechaInicio);
  
  // Determinar fecha de primer pago
  let fechaPrimerPago;
  if (fechaPrimerPagoCustom) {
    fechaPrimerPago = new Date(fechaPrimerPagoCustom);
    fechaPrimerPago.setHours(0, 0, 0, 0);
  } else {
    fechaPrimerPago = new Date(fechaInicioDate.getFullYear(), fechaInicioDate.getMonth() + 2, 10);
  }
  
  const diaPago = fechaPrimerPago.getDate();
  const capitalCuotaBase = capital / plazo;
  
  let saldo = capital;
  let ahorroTotal = 0;
  let totalCapital = 0;
  let totalInteres = 0;
  let totalSeguro = 0;
  const cuotas = [];
  let fechaAnterior = fechaInicioDate;
  let fechaPago = fechaPrimerPago;
  
  for (let i = 1; i <= plazo; i++) {
    if (i > 1) {
      fechaPago = sumarMeses(fechaPago, 1);
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
    let ahorro = cuotaFija - totalPagarRealRedondeado;
    if (ahorro < 0) ahorro = 0;
    ahorro = Math.round(ahorro * 100) / 100;
    
    totalCapital += capitalCuota;
    totalInteres += interesRedondeado;
    totalSeguro += cargoRedondeado;
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
      cuotaTotal: cuotaFija,
      saldo: saldo
    });
    
    fechaAnterior = fechaPago;
  }
  
  return {
    cuotaRedondeada: cuotaFija,
    ahorroTotal: Math.round(ahorroTotal * 100) / 100,
    cuotaRealPrimera: 0,
    totalCapital: Math.round(totalCapital * 100) / 100,
    totalInteres: Math.round(totalInteres * 100) / 100,
    totalSeguro: Math.round(totalSeguro * 100) / 100,
    cuotas
  };
};

// Simular crédito normal
const simularCredito = async (req, res) => {
  try {
    const { capital, tasa, plazo, fechaInicio, fechaPrimerPago } = req.body;
    const usuarioId = req.usuario.id;
    
    if (!capital || !tasa || !plazo) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }
    
    const resultado = calcularSimulacion(capital, tasa, plazo, fechaInicio || new Date(), fechaPrimerPago);
    
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
      totalCapital: resultado.totalCapital,
      totalInteres: resultado.totalInteres,
      totalSeguro: resultado.totalSeguro,
      cuotas: resultado.cuotas
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Simular crédito con cuota fija personalizada
const simularCreditoConCuota = async (req, res) => {
  try {
    const { capital, tasa, plazo, fechaInicio, fechaPrimerPago, cuotaFija } = req.body;
    const usuarioId = req.usuario.id;
    
    if (!capital || !tasa || !plazo) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }
    
    if (!cuotaFija || cuotaFija <= 0) {
      return res.status(400).json({ message: 'Cuota fija inválida' });
    }
    
    const resultado = calcularSimulacionConCuotaFija(capital, tasa, plazo, fechaInicio || new Date(), fechaPrimerPago, cuotaFija);
    
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
      totalCapital: resultado.totalCapital,
      totalInteres: resultado.totalInteres,
      totalSeguro: resultado.totalSeguro,
      cuotas: resultado.cuotas
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
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

module.exports = { 
  simularCredito, 
  simularCreditoConCuota,
  getHistorialSimulaciones, 
  registrarInteres 
};