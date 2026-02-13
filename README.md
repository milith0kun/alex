# GenomeAnalyzer Pro

Aplicación web profesional para análisis y comparación de genomas con IA integrada.

## 🧬 Características

- **Análisis Individual de Genomas**: Análisis completo de cualquier genoma desde NCBI
- **Comparación de Genomas**: Comparación detallada entre dos genomas
- **IA Integrada**: Interpretación biológica usando Google Gemini (Biólogo Virtual)
- **Exportación PDF**: Reportes profesionales en formato IEGE
- **Interfaz Moderna**: UI premium con glassmorphism y animaciones
- **Análisis Completo**: GC content, genes CDS, codones, intrones/exones, distribución genómica

## 📊 Métricas Analizadas

### Información Básica
- Nombre científico y común
- Longitud en pares de bases (pb)
- Contenido GC (%)
- Descripción y taxonomía

### Análisis de Genes
- Total de genes CDS
- Genes codificados
- Distancia entre genes (promedio, mínima, máxima)
- Inicio y fin de cada gen
- Distribución a lo largo del genoma

### Análisis de Codones
- Codones de inicio (ATG)
- Codones de STOP (TAA, TAG, TGA)
- Codones verdaderos vs falsos
- Análisis estadístico completo

### Estructura Genómica
- Localización de intrones y exones
- Estructura detallada por gen
- Visualizaciones gráficas

## 🚀 Instalación Local

### Requisitos Previos

- Python 3.10 o superior
- pip
- virtualenv (opcional pero recomendado)

### Pasos

1. **Clonar el repositorio**
```bash
git clone <repositorio>
cd Genoma
```

2. **Crear entorno virtual**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. **Instalar dependencias**
```bash
pip install -r requirements.txt
```

4. **Configurar variables de entorno**
```bash
# Copiar plantilla
cp .env.example .env

# Editar .env con tus credenciales
# GEMINI_API_KEY: Obtener en https://makersuite.google.com/app/apikey
# NCBI_EMAIL: Tu email (requerido por NCBI)
```

5. **Ejecutar aplicación**
```bash
python app.py
```

6. **Abrir en navegador**
```
http://localhost:5000
```

## 🌐 Despliegue en AWS

Ver guía completa en [deploy_aws.md](deploy_aws.md)

### Resumen Rápido

1. Crear instancia EC2 (Ubuntu 22.04)
2. Instalar Apache y mod_wsgi
3. Subir código y configurar
4. Configurar Apache con el archivo `apache_config.conf`
5. Configurar SSL con Let's Encrypt (opcional)

## 🔑 APIs Utilizadas

- **NCBI Entrez**: Acceso a banco de genomas
- **Google Gemini**: IA para interpretación biológica
- **Biopython**: Análisis y procesamiento de secuencias

## 📖 Uso

### Análisis Individual

1. Seleccionar "Análisis Individual"
2. Ingresar ID de acceso NCBI (ej: NC_000001.11)
3. Activar "Incluir interpretación de IA" (opcional)
4. Click en "Analizar Genoma"
5. Explorar resultados en tabs
6. Descargar PDF si es necesario

### Comparación de Genomas

1. Seleccionar "Comparación de Genomas"
2. Ingresar IDs de ambos genomas
3. Activar "Incluir interpretación de IA" (opcional)
4. Click en "Comparar Genomas"
5. Revisar comparación detallada y similitudes
6. Descargar PDF comparativo

## 🎨 Tecnologías

### Backend
- Flask
- Biopython
- Google Generative AI (Gemini)
- ReportLab (PDF)
- Matplotlib (Gráficos)

### Frontend
- HTML5/CSS3/JavaScript
- Chart.js (Visualizaciones)
- Diseño moderno con glassmorphism

### Despliegue
- Apache + mod_wsgi
- AWS EC2
- Gunicorn (alternativa)

## 📝 Ejemplos de IDs de Genoma

```
NC_000001.11  - Cromosoma humano 1
NC_000002.12  - Cromosoma humano 2
NC_045512.2   - SARS-CoV-2 (COVID-19)
NC_000913.3   - E. coli K-12
NC_012920.1   - Mitocondria humana
```

## 🛠️ Estructura del Proyecto

```
Genoma/
├── app.py                  # Aplicación Flask
├── genome_analyzer.py      # Módulo de análisis genómico
├── ai_interpreter.py       # Integración con IA
├── pdf_generator.py        # Generación de PDFs
├── config.py              # Configuración
├── wsgi.py                # Entry point WSGI
├── requirements.txt       # Dependencias
├── .env.example          # Plantilla variables de entorno
├── apache_config.conf    # Configuración Apache
├── deploy_aws.md         # Guía de despliegue
├── templates/
│   └── index.html        # Interfaz principal
└── static/
    ├── css/
    │   └── style.css     # Estilos
    └── js/
        └── main.js       # Lógica frontend
```

## 🔒 Seguridad

- Variables de entorno para API keys
- HTTPS recomendado en producción
- Validación de entrada
- Rate limiting de NCBI respetado

## 📊 Limitaciones

- Rate limit de NCBI: 3 requests/segundo (sin API key)
- Análisis de genomas muy grandes puede tomar varios minutos
- Google Gemini API tiene límites de uso gratuito

## 🐛 Solución de Problemas

### Error: "Se requiere GEMINI_API_KEY"
**Solución**: Configurar `GEMINI_API_KEY` en archivo `.env`

### Error: "Error al obtener genoma"
**Solución**: 
- Verificar ID de genoma es válido
- Verificar `NCBI_EMAIL` está configurado
- Verificar conexión a internet

### Análisis muy lento
**Solución**:
- Normal para genomas grandes
- Considerar usar instancia más potente en producción

## 📄 Licencia

Este proyecto es de código abierto para fines educativos y de investigación.

## 👥 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crear branch para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📧 Contacto

Para preguntas o soporte, crear un issue en el repositorio.

---

**GenomeAnalyzer Pro** - Análisis Genómico de Precisión 🧬
