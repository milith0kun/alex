# Instrucciones para Copilot

## Estilo de Código
- Usar Python 3.9+ con type hints.
- Seguir PEP 8.
- Usar docstrings en funciones y clases.
- Frontend: HTML5 semántico, CSS moderno (CSS Variables, Flexbox, Grid), JS vanilla (ES6+).

## Arquitectura
- Flask para backend.
- Estructura MVC simplificada.
- Separación clara entre lógica de negocio (analyzer, comparator) y vistas.

## Testing
- Pytest para pruebas unitarias.
- Pruebas de integración para endpoints clave.

## Seguridad
- Validar inputs de usuario.
- No exponer API keys en código (usar .env).
