# Esquemas de Comunicación para el Sistema de Detección de Anomalías

Este directorio contiene los esquemas JSON que definen los formatos estándar para la comunicación entre el orquestador y los modelos de clasificación de anomalías.

## Propósito

Estos esquemas tienen como objetivo:

- Estandarizar la comunicación entre componentes
- Documentar claramente los formatos de mensajes esperados
- Facilitar la validación de datos
- Garantizar la compatibilidad entre versiones del sistema
- Servir como referencia para desarrolladores que implementen nuevos modelos

## Esquemas Incluidos

El archivo `api-schemas.json` define los siguientes esquemas:

### Formato de Datos Base

- `discharge` - Estructura base de un experimento/descarga con sus señales

### Solicitudes

- `predictionRequest` - Formato para solicitar una predicción de anomalía
- `trainingRequest` - Formato para solicitar el entrenamiento de un modelo

### Respuestas

- `predictionResponse` - Formato de respuesta con la predicción del modelo
- `trainingResponse` - Formato de respuesta tras el entrenamiento
- `healthCheckResponse` - Formato de respuesta para verificación de estado del modelo
- `errorResponse` - Formato estándar para errores

## Cómo Usar los Esquemas

### Para Validación

Puedes validar tus datos contra estos esquemas utilizando bibliotecas como:

```javascript
const Ajv = require('ajv');
const schemas = require('./api-schemas.json');

const ajv = new Ajv();
const validate = ajv.compile(schemas.schemas.predictionRequest);
const isValid = validate(yourData);

if (!isValid) {
  console.error('Errores de validación:', validate.errors);
}
```

### Para Documentación

Incluye una referencia a estos esquemas en la documentación de tu API:

```
Los endpoints de este servicio siguen los esquemas definidos en api-schemas.json.
Ver la sección 'predictionRequest' para el formato esperado en las solicitudes.
```

### Para Desarrollo

Al implementar un nuevo modelo de detección de anomalías, asegúrate de que tu servicio:

1. Reciba datos en el formato especificado en `predictionRequest`
2. Responda con datos en el formato de `predictionResponse`
3. Implemente un endpoint de salud siguiendo el formato `healthCheckResponse`

## Ejemplos

Cada esquema incluye un ejemplo que ilustra el formato esperado. Estos ejemplos pueden
utilizarse como punto de partida para el desarrollo.

## Actualización de Esquemas

Al modificar estos esquemas:

1. Mantén la compatibilidad hacia atrás cuando sea posible
2. Incrementa el número de versión si hay cambios importantes
3. Documenta los cambios en un registro de cambios
4. Notifica a todos los equipos que dependen de estos esquemas

---

© 2025 Sistema de Detección de Anomalías