const express = require('express');
const orchestratorController = require('../controllers/orchestrator.controller');
const { validateExperimentalData, validateModelConfig } = require('../middleware/validation.middleware');
const router = express.Router();

// Ruta para realizar predicciones
router.post('/predict', validateExperimentalData, orchestratorController.predict);

// Ruta para entrenamiento de modelos
router.post('/train', validateExperimentalData, orchestratorController.train);

// Ruta para verificar la salud de los servicios
router.get('/health', orchestratorController.health);

// Rutas para la gestión de configuración
router.get('/config', orchestratorController.getConfig);
router.post('/config/model', validateModelConfig, orchestratorController.updateModelConfig);
router.post('/config/url', orchestratorController.updateModelUrl);

module.exports = router;