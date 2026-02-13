"""
WSGI entry point para la aplicación
Usado por Apache con mod_wsgi y Gunicorn
"""
import sys
import os

# Añadir el directorio del proyecto al path
project_dir = os.path.dirname(__file__)
sys.path.insert(0, project_dir)

from app import app as application

if __name__ == "__main__":
    application.run()
