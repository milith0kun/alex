# Guía de Inicio Rápido - GenomeAnalyzer Pro

## Configuración Inicial (Primera Vez)

### 1. Copiar Archivo de Variables de Entorno

El archivo `.env.example` es una plantilla. Crea tu propio archivo `.env`:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Linux/Mac:**
```bash
cp .env.example .env
```

### 2. Obtener Google Gemini API Key (GRATIS)

1. Visita: https://makersuite.google.com/app/apikey
2. Inicia sesión con tu cuenta Google
3. Click en "Create API Key"
4. Copia el API key generado

### 3. Configurar Variables de Entorno

Edita el archivo `.env` que creaste:

```env
# Pega tu API key de Gemini aquí
GEMINI_API_KEY=AIzaSy...tu_clave_aqui

# Tu email (requerido por NCBI)
NCBI_EMAIL=tu_email@gmail.com

# Genera una clave secreta (puedes usar el comando de abajo)
FLASK_SECRET_KEY=genera_una_clave_aleatoria

# Entorno
FLASK_ENV=development
```

**Para generar FLASK_SECRET_KEY:**

**Windows (PowerShell):**
```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

**Linux/Mac:**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 4. Instalar Dependencias

**Windows:**
```powershell
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
.\venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

**Linux/Mac:**
```bash
# Crear entorno virtual
python3 -m venv venv

# Activar entorno virtual
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 5. Ejecutar la Aplicación

```bash
python app.py
```

Deberías ver algo como:
```
 * Running on http://0.0.0.0:5000
 * Debug mode: on
```

### 6. Abrir en el Navegador

Abre tu navegador y ve a:
```
http://localhost:5000
```

## Probar la Aplicación

### Análisis Individual - Ejemplo 1: Cromosoma Humano

1. Selecciona "Análisis Individual"
2. Ingresa: `NC_000001.11`
3. Marca "Incluir interpretación de IA"
4. Click "Analizar Genoma"
5. Espera 30-60 segundos (depende del genoma)
6. Explora los resultados en las diferentes tabs

### Análisis Individual - Ejemplo 2: COVID-19

1. Selecciona "Análisis Individual"
2. Ingresa: `NC_045512.2`
3. Click "Analizar Genoma"
4. Resultados aparecerán más rápido (genoma más pequeño)

### Comparación - Ejemplo: Dos Cromosomas Humanos

1. Selecciona "Comparación de Genomas"
2. Genoma 1: `NC_000001.11` (Cromosoma 1)
3. Genoma 2: `NC_000002.12` (Cromosoma 2)
4. Marca "Incluir interpretación de IA"
5. Click "Comparar Genomas"
6. Espera 60-120 segundos
7. Revisa la comparación detallada

## Más IDs de Genoma para Probar

```
NC_000001.11  - Cromosoma humano 1 (largo, ~2-3 minutos)
NC_045512.2   - SARS-CoV-2 (COVID-19) (rápido, ~30 segundos)
NC_000913.3   - E. coli K-12 (medio, ~1 minuto)
NC_012920.1   - Mitocondria humana (rápido, ~20 segundos)
NC_001416.1   - Bacteriófago lambda (muy rápido, ~10 segundos)
```

## Descargar PDF

Después de analizar cualquier genoma:

1. Click en el botón "Descargar PDF"
2. El PDF se generará automáticamente
3. Se descargará a tu carpeta de Descargas
4. Abre el PDF para ver el reporte completo en formato IEGE

## Solución de Problemas Comunes

### Error: "Se requiere GEMINI_API_KEY"

**Problema**: No configuraste el API key de Gemini

**Solución**:
1. Asegúrate de haber creado el archivo `.env`
2. Verifica que copiaste el API key correctamente
3. Reinicia la aplicación

### Error: "Error al obtener genoma"

**Problema**: ID de genoma inválido o problemas de conexión

**Solución**:
1. Verifica que el ID sea correcto (ej: NC_000001.11)
2. Verifica tu conexión a internet
3. Verifica que `NCBI_EMAIL` esté configurado en `.env`

### La aplicación se ejecuta pero no carga en el navegador

**Problema**: Firewall o puerto ocupado

**Solución**:
1. Verifica que nada más esté usando el puerto 5000
2. Intenta cambiar el puerto en `app.py`:
   ```python
   app.run(host='0.0.0.0', port=5001, debug=True)
   ```
3. Luego accede a `http://localhost:5001`

### Análisis muy lento

**Problema**: Normal para genomas grandes

**Solución**:
- Genomas grandes (cromosomas humanos) pueden tomar 2-3 minutos
- Prueba primero con genomas pequeños (virus, mitocondrias)
- Ten paciencia, la aplicación muestra "Analizando..." mientras trabaja

### No se genera el PDF

**Problema**: Error en la generación de PDF

**Solución**:
1. Verifica que instalaste todas las dependencias
2. Reinicia la aplicación
3. Revisa la consola para ver mensajes de error

## Estructura de Carpetas

```
Genoma/
├── venv/                 # Entorno virtual (se crea automáticamente)
├── templates/           # HTML
├── static/             
│   ├── css/            # Estilos
│   └── js/             # JavaScript
├── pdfs/               # PDFs generados (se crea automáticamente)
├── app.py              # Aplicación principal
├── .env                # TUS variables de entorno (CREAR ESTE)
├── .env.example        # Plantilla
└── requirements.txt    # Dependencias
```

## Comandos Rápidos

### Activar Entorno Virtual

**Windows:**
```powershell
.\venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### Desactivar Entorno Virtual

```bash
deactivate
```

### Actualizar Dependencias

```bash
pip install --upgrade -r requirements.txt
```

### Reinstalar Todo

**Windows:**
```powershell
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

**Linux/Mac:**
```bash
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Siguiente Paso: Despliegue en AWS

Cuando estés listo para poner la aplicación en producción, consulta:

📄 **[deploy_aws.md](deploy_aws.md)** - Guía completa de despliegue en AWS

---

¿Listo para analizar genomas? 🧬

1. ✅ Configura `.env`
2. ✅ Instala dependencias
3. ✅ Ejecuta `python app.py`
4. ✅ Abre `http://localhost:5000`
5. 🎉 ¡Comienza a analizar!
