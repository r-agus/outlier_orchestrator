const { StatusCodes } = require('http-status-codes');
const logger = require('../utils/logger');

/**
 * Middleware para validar el formato de los datos experimentales
 * @param {Request} req - Objeto de solicitud HTTP
 * @param {Response} res - Objeto de respuesta HTTP
 * @param {Function} next - Función para continuar con el siguiente middleware
 */
function validateExperimentalData(req, res, next) {
  const data = req.body;
  
  try {
    // Verificar que existan datos
    if (!data || !data.data || !Array.isArray(data.data)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Los datos experimentales deben estar en un array bajo la propiedad "data"'
      });
    }
    
    // Verificar que haya al menos un punto de datos
    if (data.data.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Se requiere al menos un punto de datos'
      });
    }
    
    // Verificar que todos los puntos de datos sean arrays de igual longitud
    const firstPointLength = data.data[0].length;
    
    if (!firstPointLength || firstPointLength !== 7) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Cada punto de datos debe contener exactamente 7 valores (uno por sensor)'
      });
    }
    
    const invalidPoints = data.data.filter(point => 
      !Array.isArray(point) || point.length !== firstPointLength
    );
    
    if (invalidPoints.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Todos los puntos de datos deben tener la misma cantidad de sensores'
      });
    }
    
    // Verificar que todos los valores sean numéricos
    const nonNumericData = data.data.some(point => 
      point.some(value => typeof value !== 'number' || isNaN(value))
    );
    
    if (nonNumericData) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Todos los valores deben ser numéricos'
      });
    }
    
    // Si pasa todas las validaciones, continuar
    logger.info(`Validación exitosa: ${data.data.length} puntos de datos con ${firstPointLength} sensores`);
    next();
  } catch (error) {
    logger.error(`Error en validación de datos: ${error.message}`);
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: 'Error en la validación de los datos experimentales',
      details: error.message
    });
  }
}

/**
 * Middleware para validar los datos de configuración de modelo
 * @param {Request} req - Objeto de solicitud HTTP
 * @param {Response} res - Objeto de respuesta HTTP
 * @param {Function} next - Función para continuar con el siguiente middleware
 */
function validateModelConfig(req, res, next) {
  const { modelName, enabled } = req.body;
  
  if (!modelName || typeof modelName !== 'string') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: 'Se requiere un nombre de modelo válido'
    });
  }
  
  if (typeof enabled !== 'boolean') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: 'La propiedad "enabled" debe ser un valor booleano'
    });
  }
  
  next();
}

module.exports = {
  validateExperimentalData,
  validateModelConfig
};