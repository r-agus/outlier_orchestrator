const { StatusCodes } = require('http-status-codes');
const orchestratorService = require('../services/orchestrator.service');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Controlador para la orquestación de modelos y predicciones
 */
class OrchestratorController {
  /**
   * Realiza una predicción utilizando todos los modelos disponibles
   * @param {Request} req - Objeto de solicitud HTTP
   * @param {Response} res - Objeto de respuesta HTTP
   */
  async predict(req, res) {
    try {
      const experimentData = req.body;
      
      // Validar que se recibieron datos experimentales
      if (!experimentData || !experimentData.data) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Se requieren datos experimentales para realizar la predicción'
        });
      }
      
      logger.info(`Recibida petición de predicción con ${experimentData.data.length} puntos de datos`);
      
      // Procesar predicción con el orquestador
      const result = await orchestratorService.orchestrate(experimentData);
      
      // Determinar el código de estado según el resultado
      if (result.voting.decision === null) {
        return res.status(StatusCodes.CONFLICT).json({
          message: 'No se pudo determinar una predicción clara',
          result
        });
      }
      
      return res.status(StatusCodes.OK).json({
        message: 'Predicción completada con éxito',
        class: result.voting.decision,
        confidence: result.voting.confidence,
        details: result
      });
    } catch (error) {
      logger.error(`Error en predicción: ${error.message}`);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Error al procesar la predicción',
        message: error.message
      });
    }
  }

  /**
   * Envía datos de entrenamiento a todos los modelos
   * @param {Request} req - Objeto de solicitud HTTP 
   * @param {Response} res - Objeto de respuesta HTTP
   */
  async train(req, res) {
    try {
      const trainingData = req.body;
      
      // Validar que se recibieron datos de entrenamiento
      if (!trainingData || !trainingData.data) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Se requieren datos de entrenamiento'
        });
      }
      
      logger.info(`Recibida petición de entrenamiento con ${trainingData.data.length} puntos de datos`);
      
      // Enviar datos de entrenamiento a todos los modelos
      const result = await orchestratorService.trainModels(trainingData);
      
      return res.status(StatusCodes.OK).json({
        message: 'Entrenamiento iniciado en los modelos disponibles',
        details: result
      });
    } catch (error) {
      logger.error(`Error en entrenamiento: ${error.message}`);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Error al procesar el entrenamiento',
        message: error.message
      });
    }
  }

  /**
   * Obtiene el estado de salud de los modelos
   * @param {Request} req - Objeto de solicitud HTTP
   * @param {Response} res - Objeto de respuesta HTTP
   */
  async health(req, res) {
    try {
      const healthStatus = await orchestratorService.healthCheck();
      
      // Si no hay modelos disponibles, reportar servicio degradado
      const statusCode = healthStatus.availableModels > 0 
        ? StatusCodes.OK 
        : StatusCodes.SERVICE_UNAVAILABLE;
      
      return res.status(statusCode).json({
        serverStatus: 'online',
        ...healthStatus
      });
    } catch (error) {
      logger.error(`Error en health check: ${error.message}`);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        serverStatus: 'error',
        error: error.message
      });
    }
  }

  /**
   * Obtiene la configuración actual del sistema
   * @param {Request} req - Objeto de solicitud HTTP
   * @param {Response} res - Objeto de respuesta HTTP
   */
  async getConfig(req, res) {
    try {
      // Devolver configuración relevante incluyendo las URLs
      const safeConfig = {
        models: Object.keys(config.models).map(modelName => ({
          name: modelName,
          enabled: config.models[modelName].enabled,
          url: config.models[modelName].url,
          trainingUrl: config.models[modelName].trainingUrl
        })),
        timeout: config.timeouts.model
      };
      
      return res.status(StatusCodes.OK).json(safeConfig);
    } catch (error) {
      logger.error(`Error al obtener configuración: ${error.message}`);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error.message
      });
    }
  }

  /**
   * Actualiza la configuración para habilitar/deshabilitar modelos
   * @param {Request} req - Objeto de solicitud HTTP
   * @param {Response} res - Objeto de respuesta HTTP
   */
  async updateModelConfig(req, res) {
    try {
      const { modelName, enabled } = req.body;
      
      if (!modelName || typeof enabled !== 'boolean') {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Se requiere nombre de modelo y estado de habilitación'
        });
      }
      
      if (!config.models[modelName]) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: `Modelo '${modelName}' no encontrado`
        });
      }
      
      // Actualizar configuración
      config.models[modelName].enabled = enabled;
      
      logger.info(`Modelo '${modelName}' ${enabled ? 'habilitado' : 'deshabilitado'}`);
      
      return res.status(StatusCodes.OK).json({
        message: `Modelo '${modelName}' ${enabled ? 'habilitado' : 'deshabilitado'}`,
        models: Object.keys(config.models).map(model => ({
          name: model,
          enabled: config.models[model].enabled,
          url: config.models[model].url,
          trainingUrl: config.models[model].trainingUrl
        }))
      });
    } catch (error) {
      logger.error(`Error al actualizar configuración: ${error.message}`);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error.message
      });
    }
  }

  /**
   * Actualiza la URL de un modelo específico
   * @param {Request} req - Objeto de solicitud HTTP
   * @param {Response} res - Objeto de respuesta HTTP
   */
  async updateModelUrl(req, res) {
    try {
      const { modelName, url, type } = req.body;
      
      if (!modelName || !url || typeof url !== 'string') {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Se requiere nombre de modelo y URL válida'
        });
      }
      
      if (!config.models[modelName]) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: `Modelo '${modelName}' no encontrado`
        });
      }
      
      // Validar el tipo
      if (type && !['predict', 'train'].includes(type)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: "El tipo debe ser 'predict' o 'train'"
        });
      }
      
      // Actualizar configuración
      config.updateModelUrl(modelName, url, type || 'predict');
      
      logger.info(`URL de ${type || 'predict'} del modelo '${modelName}' actualizada a ${url}`);
      
      return res.status(StatusCodes.OK).json({
        message: `URL de ${type || 'predict'} del modelo '${modelName}' actualizada`,
        models: Object.keys(config.models).map(model => ({
          name: model,
          enabled: config.models[model].enabled,
          url: config.models[model].url,
          trainingUrl: config.models[model].trainingUrl
        }))
      });
    } catch (error) {
      logger.error(`Error al actualizar URL: ${error.message}`);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error.message
      });
    }
  }
}

module.exports = new OrchestratorController();