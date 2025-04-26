require('dotenv').config();

// Configuración persistente (se guarda en memoria durante la ejecución)
let persistentConfig = {
  models: {
    svm: {
      url: process.env.SVM_MODEL_URL || 'http://localhost:8001/predict',
      enabled: true,
      trainingUrl: process.env.SVM_TRAINING_URL || 'http://localhost:8001/train'
    },
    lstm: {
      url: process.env.LSTM_MODEL_URL || 'http://localhost:8002/predict',
      enabled: true,
      trainingUrl: process.env.LSTM_TRAINING_URL || 'http://localhost:8002/train'
    },
    xgboost: {
      url: process.env.XGBOOST_MODEL_URL || 'http://localhost:8003/predict',
      enabled: true,
      trainingUrl: process.env.XGBOOST_TRAINING_URL || 'http://localhost:8003/train'
    }
  }
};

module.exports = {
  // Server configuration
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  
  // Model endpoints - referencias a la configuración persistente
  get models() {
    return persistentConfig.models;
  },
  
  // Función para actualizar las URLs de los modelos
  updateModelUrl(modelName, url, type = 'predict') {
    if (!persistentConfig.models[modelName]) {
      throw new Error(`Modelo '${modelName}' no encontrado`);
    }
    
    if (type === 'predict') {
      persistentConfig.models[modelName].url = url;
    } else if (type === 'train') {
      persistentConfig.models[modelName].trainingUrl = url;
    }
  },
  
  // Request timeouts
  timeouts: {
    model: parseInt(process.env.MODEL_TIMEOUT || 10000), // 10 seconds
    training: parseInt(process.env.TRAINING_TIMEOUT || 60000) // 1 minute
  },
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info'
};