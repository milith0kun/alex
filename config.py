"""
Configuración de la aplicación
"""
import os
from dotenv import load_dotenv

# Obtener la ruta absoluta al directorio del proyecto
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
# Cargar .env usando ruta absoluta para producción (Apache/mod_wsgi)
load_dotenv(os.path.join(BASE_DIR, '.env'))

class Config:
    """Configuración base"""
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # API Keys
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    NCBI_EMAIL = os.getenv('NCBI_EMAIL', 'your_email@example.com')
    
    # NCBI Configuration
    NCBI_API_KEY = os.getenv('NCBI_API_KEY', None)  # Opcional, aumenta rate limit
    
    # Upload Configuration
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max
    
    # CORS
    CORS_HEADERS = 'Content-Type'

class DevelopmentConfig(Config):
    """Configuración de desarrollo"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Configuración de producción"""
    DEBUG = False
    TESTING = False

# Configuración según entorno
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Obtiene la configuración según el entorno"""
    env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default'])
