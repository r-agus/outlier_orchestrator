const { StatusCodes } = require('http-status-codes');
const logger = require('../utils/logger');

/**
 * Middleware para validar el formato de los datos experimentales (formato experiments)
 * @param {Request} req - Objeto de solicitud HTTP
 * @param {Response} res - Objeto de respuesta HTTP
 * @param {Function} next - Función para continuar con el siguiente middleware
 */
function validateExperimentalData(req, res, next) {
  const data = req.body;
  
  try {
    // Validar formato experiments
    if (!data || !data.experiments || !Array.isArray(data.experiments)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Formato de datos no válido. Se espera un objeto con un array "experiments"'
      });
    }
    
    // Verificar que hay al menos un experimento
    if (data.experiments.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Se requiere al menos un experimento'
      });
    }
    
    // Validar cada experimento
    for (const experiment of data.experiments) {
      // Verificar que tiene ID y sensores
      if (!experiment.id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Cada experimento debe tener un ID'
        });
      }
      
      if (!experiment.sensors || !Array.isArray(experiment.sensors) || experiment.sensors.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: `El experimento ${experiment.id} debe tener al menos un sensor`
        });
      }
      
      // Si tiene tiempos a nivel de experimento, validarlos
      if (experiment.times) {
        if (!Array.isArray(experiment.times) || experiment.times.length === 0) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: `El experimento ${experiment.id} tiene un formato de tiempos inválido`
          });
        }
        
        // Verificar que todos los valores son numéricos
        if (experiment.times.some(value => typeof value !== 'number' || isNaN(value))) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: `El experimento ${experiment.id} tiene valores de tiempo no numéricos`
          });
        }
      }
      
      // Validar sensores
      for (const sensor of experiment.sensors) {
        // Verificar nombre de archivo
        if (!sensor.fileName) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: `Sensor sin nombre de archivo en experimento ${experiment.id}`
          });
        }
        
        // Verificar valores
        if (!Array.isArray(sensor.values) || sensor.values.length === 0) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: `El sensor ${sensor.fileName} del experimento ${experiment.id} debe tener un array de valores no vacío`
          });
        }
        
        // Si el experimento no tiene tiempos comunes, el sensor debe tenerlos
        if (!experiment.times) {
          if (!Array.isArray(sensor.times) || sensor.times.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
              error: `El sensor ${sensor.fileName} del experimento ${experiment.id} debe tener un array de tiempos cuando no hay tiempos a nivel de experimento`
            });
          }
          
          if (sensor.times.length !== sensor.values.length) {
            return res.status(StatusCodes.BAD_REQUEST).json({
              error: `El sensor ${sensor.fileName} del experimento ${experiment.id} tiene diferentes longitudes para tiempos (${sensor.times.length}) y valores (${sensor.values.length})`
            });
          }
          
          // Verificar que los tiempos son numéricos
          if (sensor.times.some(value => typeof value !== 'number' || isNaN(value))) {
            return res.status(StatusCodes.BAD_REQUEST).json({
              error: `El sensor ${sensor.fileName} del experimento ${experiment.id} tiene valores de tiempo no numéricos`
            });
          }
        } else {
          // Si hay tiempos a nivel de experimento, verificar que las longitudes coincidan
          if (experiment.times.length !== sensor.values.length) {
            return res.status(StatusCodes.BAD_REQUEST).json({
              error: `El sensor ${sensor.fileName} del experimento ${experiment.id} tiene una longitud de valores (${sensor.values.length}) que no coincide con la longitud de tiempos del experimento (${experiment.times.length})`
            });
          }
        }
        
        // Verificar que los valores son numéricos
        if (sensor.values.some(value => typeof value !== 'number' || isNaN(value))) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: `El sensor ${sensor.fileName} del experimento ${experiment.id} tiene valores no numéricos`
          });
        }
      }
    }
    
    logger.info(`Validación exitosa: ${data.experiments.length} experimentos con datos de sensores`);
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