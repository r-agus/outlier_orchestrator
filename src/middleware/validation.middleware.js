const { StatusCodes } = require('http-status-codes');
const logger = require('../utils/logger');

/**
 * Middleware para validar el formato de los datos experimentales
 * tanto en el formato original como en el nuevo formato de sensores
 * @param {Request} req - Objeto de solicitud HTTP
 * @param {Response} res - Objeto de respuesta HTTP
 * @param {Function} next - Función para continuar con el siguiente middleware
 */
function validateExperimentalData(req, res, next) {
  const data = req.body;
  
  try {
    // Primer caso: formato antiguo (data como array de arrays)
    if (data && Array.isArray(data.data)) {
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
      
      logger.info(`Validación exitosa (formato antiguo): ${data.data.length} puntos de datos con ${firstPointLength} sensores`);
      next();
      return;
    }
    
    // Segundo caso: nuevo formato (array de objetos de sensor)
    if (data && Array.isArray(data.sensors)) {
      // Verificar que hay al menos un sensor
      if (data.sensors.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Se requiere al menos un sensor'
        });
      }
      
      // Verificar que cada sensor tiene el formato correcto
      for (const sensor of data.sensors) {
        if (!sensor.fileName) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: 'Cada sensor debe tener un nombre de archivo'
          });
        }
        
        if (!Array.isArray(sensor.times) || !Array.isArray(sensor.values)) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: `El sensor ${sensor.fileName} debe tener arrays de tiempos y valores`
          });
        }
        
        if (sensor.times.length !== sensor.values.length) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: `El sensor ${sensor.fileName} tiene diferentes longitudes para tiempos (${sensor.times.length}) y valores (${sensor.values.length})`
          });
        }
        
        if (sensor.times.length === 0) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: `El sensor ${sensor.fileName} no tiene datos`
          });
        }
        
        if (sensor.length !== undefined && sensor.length !== sensor.times.length) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: `El sensor ${sensor.fileName} tiene un valor de longitud (${sensor.length}) que no coincide con la longitud real de los datos (${sensor.times.length})`
          });
        }
        
        // Verificar que todos los valores son numéricos
        const nonNumericTimes = sensor.times.some(value => typeof value !== 'number' || isNaN(value));
        const nonNumericValues = sensor.values.some(value => typeof value !== 'number' || isNaN(value));
        
        if (nonNumericTimes) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: `El sensor ${sensor.fileName} tiene valores de tiempo no numéricos`
          });
        }
        
        if (nonNumericValues) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: `El sensor ${sensor.fileName} tiene valores no numéricos`
          });
        }
        
        // Verificar el tiempo de anomalía (si existe)
        if (sensor.anomalyTime !== null && sensor.anomalyTime !== undefined) {
          if (typeof sensor.anomalyTime !== 'number' || isNaN(sensor.anomalyTime)) {
            return res.status(StatusCodes.BAD_REQUEST).json({
              error: `El sensor ${sensor.fileName} tiene un tiempo de anomalía no numérico`
            });
          }
        }
      }
      
      logger.info(`Validación exitosa (formato nuevo): ${data.sensors.length} sensores`);
      next();
      return;
    }
    
    // Si no coincide con ningún formato conocido
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: 'Formato de datos no válido. Se espera un objeto con una propiedad "data" (formato antiguo) o "sensors" (formato nuevo)'
    });
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