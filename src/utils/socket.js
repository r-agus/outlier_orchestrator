const logger = require('./logger');
const orchestratorService = require('../services/orchestrator.service');

/**
 * Configura la comunicación en tiempo real con socket.io
 * @param {SocketIO.Server} io - Instancia del servidor de Socket.io
 */
module.exports = function(io) {
  // Mantener registro del estado de los modelos
  const modelStatus = {
    svm: { status: 'unknown', lastCheck: null },
    lstm: { status: 'unknown', lastCheck: null },
    xgboost: { status: 'unknown', lastCheck: null }
  };

  // Registro de predicciones realizadas
  const predictionLog = [];

  // Mantener un máximo de 100 registros en el historial
  function addPrediction(prediction) {
    predictionLog.unshift(prediction);
    if (predictionLog.length > 100) {
      predictionLog.pop();
    }
  }

  // Monitorear el estado de los modelos cada 30 segundos
  const healthCheckInterval = setInterval(async () => {
    try {
      const health = await orchestratorService.healthCheck();
      
      health.models.forEach(model => {
        modelStatus[model.model] = {
          status: model.status,
          lastCheck: new Date()
        };
      });
      
      io.emit('health-update', modelStatus);
    } catch (error) {
      logger.error(`Error en health check programado: ${error.message}`);
    }
  }, 30000);

  // Gestionar conexiones de clientes
  io.on('connection', (socket) => {
    logger.info(`Cliente conectado: ${socket.id}`);
    
    // Enviar estado inicial
    socket.emit('health-update', modelStatus);
    socket.emit('prediction-history', predictionLog);
    
    // Manejar solicitud de estado actual
    socket.on('request-health', async () => {
      try {
        const health = await orchestratorService.healthCheck();
        
        health.models.forEach(model => {
          modelStatus[model.model] = {
            status: model.status,
            lastCheck: new Date()
          };
        });
        
        socket.emit('health-update', modelStatus);
      } catch (error) {
        logger.error(`Error al obtener estado de salud: ${error.message}`);
        socket.emit('error', { message: 'Error al obtener estado de los modelos' });
      }
    });
    
    // Manejar solicitud de predicción manual desde el dashboard
    socket.on('run-prediction', async (data) => {
      try {
        const result = await orchestratorService.orchestrate(data);
        
        const predictionRecord = {
          timestamp: new Date(),
          result: result.voting.decision,
          confidence: result.voting.confidence,
          votes: result.voting.votes,
          details: result
        };
        
        addPrediction(predictionRecord);
        io.emit('new-prediction', predictionRecord);
        
        socket.emit('prediction-result', result);
      } catch (error) {
        logger.error(`Error en predicción manual: ${error.message}`);
        socket.emit('error', { message: 'Error al procesar la predicción' });
      }
    });
    
    // Manejar solicitudes de habilitación/deshabilitación de modelos
    socket.on('toggle-model', async ({ modelName, enabled }) => {
      try {
        // Este evento actualizará la configuración sin necesidad de reiniciar el servidor
        if (orchestratorService.models[modelName]) {
          orchestratorService.models[modelName].enabled = enabled;
          io.emit('config-update', {
            models: Object.keys(orchestratorService.models).map(model => ({
              name: model,
              enabled: orchestratorService.models[model].enabled
            }))
          });
          
          socket.emit('success', { message: `Modelo ${modelName} ${enabled ? 'habilitado' : 'deshabilitado'}` });
        } else {
          socket.emit('error', { message: `Modelo ${modelName} no encontrado` });
        }
      } catch (error) {
        logger.error(`Error al actualizar configuración: ${error.message}`);
        socket.emit('error', { message: 'Error al actualizar configuración' });
      }
    });
    
    // Manejar desconexiones
    socket.on('disconnect', () => {
      logger.info(`Cliente desconectado: ${socket.id}`);
    });
  });

  // Limpiar intervalo al detener el servidor
  process.on('SIGINT', () => {
    clearInterval(healthCheckInterval);
    process.exit(0);
  });

  // Exponer funcionalidad para registrar nuevas predicciones desde la API
  return {
    registerPrediction: (prediction) => {
      addPrediction(prediction);
      io.emit('new-prediction', prediction);
    }
  };
};