# Orquestador de modelos

Este repositorio contiene el frontend del proyecto. Desde aquí se puede seleccionar los modelos que se quieren usar, entrenar los mismos y predecir valores. 

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/outlierClassifier/outlier_orchestrator.git

# Entrar al directorio
cd outlier_orchestrator

# Instalar dependencias
npm install

# Crear archivo .env (basado en .env.example)
cp .env.example .env
```

## Configuración

El archivo `.env` contiene la configuración necesaria para el servidor:

```
PORT=3000
NODE_ENV=development
MODEL_TIMEOUT=10000
SVM_MODEL_URL=http://localhost:8001/predict
LSTM_MODEL_URL=http://localhost:8002/predict
XGBOOST_MODEL_URL=http://localhost:8003/predict
LOG_LEVEL=info
```

## Uso

```bash
# Iniciar en modo desarrollo con recarga automática
npm run dev

# Iniciar en modo producción
npm start
```

## API Endpoints

### Predicción
```
POST /api/predict
```
Realiza una predicción utilizando todos los modelos disponibles y aplica votación.

Ejemplo de payload:
```json
{
  "data": [
    [1.2, 0.5, 3.1, 0.8, 1.7, 2.0, 0.3],
    [1.3, 0.6, 3.0, 0.7, 1.6, 2.1, 0.4],
    ...
  ],
  "metadata": {
    "dischargesId": "exp123",
    "sampleRate": 16
  }
}
```

### Estado de Salud
```
GET /api/health
```
Verifica la disponibilidad de todos los modelos y el estado del sistema.

### Configuración
```
GET /api/config
```
Obtiene la configuración actual del sistema.

```
POST /api/config/model
```
Actualiza la configuración de un modelo específico.

Ejemplo de payload:
```json
{
  "modelName": "svm",
  "enabled": false
}
```

## Flujo de Trabajo
1. El usuario envía datos experimentales al servidor central
2. El servidor distribuye los datos a todos los endpoints disponibles
3. Cada endpoint procesa independientemente los datos con su respectivo modelo
4. El servidor central espera las respuestas (con timeout configurable)
5. Se aplica el mecanismo de votación para determinar la clase final
6. Se retorna el resultado al usuario junto con métricas relevantes

## Desarrollado con

* [Node.js](https://nodejs.org/) - Entorno de ejecución para JavaScript
* [Express](https://expressjs.com/) - Framework web para Node.js
* [Axios](https://axios-http.com/) - Cliente HTTP basado en promesas
* [Winston](https://github.com/winstonjs/winston) - Logger para Node.js
