# Guía de Despliegue en AWS - GenomeAnalyzer Pro

## Requisitos Previos

- Cuenta de AWS
- Conocimientos básicos de Linux/Ubuntu
- Dominio (opcional, pero recomendado)

## Paso 1: Configurar Instancia EC2

### 1.1 Crear Instancia

1. Ir a AWS Console → EC2 → Launch Instance
2. Seleccionar AMI: **Ubuntu Server 22.04 LTS**
3. Tipo de instancia: **t2.medium** (mínimo) o **t2.large** (recomendado para análisis grandes)
4. Configurar Security Group:
   - SSH (22): Tu IP
   - HTTP (80): 0.0.0.0/0
   - HTTPS (443): 0.0.0.0/0
5. Crear y descargar key pair (.pem)

### 1.2 Conectar a la Instancia

```bash
chmod 400 tu-key.pem
ssh -i tu-key.pem ubuntu@tu-ip-publica
```

## Paso 2: Instalar Dependencias del Sistema

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Python y herramientas
sudo apt install -y python3.10 python3-pip python3-venv

# Instalar Apache y mod_wsgi
sudo apt install -y apache2 apache2-dev
sudo apt install -y libapache2-mod-wsgi-py3

# Instalar git
sudo apt install -y git

# Habilitar mod_wsgi
sudo a2enmod wsgi

# Reiniciar Apache
sudo systemctl restart apache2
```

## Paso 3: Configurar Aplicación

### 3.1 Crear Directorio del Proyecto

```bash
sudo mkdir -p /var/www/genomeanalyzer
sudo chown -R ubuntu:ubuntu /var/www/genomeanalyzer
cd /var/www/genomeanalyzer
```

### 3.2 Subir Código

**Opción A: Usando Git**
```bash
git clone <tu-repositorio> .
```

**Opción B: Usando SCP (desde tu máquina local)**
```bash
scp -i tu-key.pem -r ./Genoma/* ubuntu@tu-ip:/var/www/genomeanalyzer/
```

### 3.3 Crear Entorno Virtual

```bash
cd /var/www/genomeanalyzer
python3 -m venv venv
source venv/bin/activate
```

### 3.4 Instalar Dependencias Python

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

## Paso 4: Configurar Variables de Entorno

```bash
# Copiar plantilla
cp .env.example .env

# Editar archivo .env
nano .env
```

**Configurar:**
```env
GEMINI_API_KEY=tu_api_key_de_gemini
NCBI_EMAIL=tu_email@ejemplo.com
FLASK_SECRET_KEY=genera_una_clave_segura_aqui
FLASK_ENV=production
```

**Para generar FLASK_SECRET_KEY:**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

## Paso 5: Configurar Apache

### 5.1 Crear Configuración

```bash
sudo nano /etc/apache2/sites-available/genomeanalyzer.conf
```

Copiar el contenido de `apache_config.conf` y ajustar:
- `ServerName` con tu dominio o IP
- Rutas si es necesario

### 5.2 Habilitar Sitio

```bash
# Deshabilitar sitio por defecto
sudo a2dissite 000-default.conf

# Habilitar nuestro sitio
sudo a2ensite genomeanalyzer.conf

# Verificar configuración
sudo apache2ctl configtest

# Reiniciar Apache
sudo systemctl restart apache2
```

### 5.3 Ajustar Permisos

```bash
sudo chown -R www-data:www-data /var/www/genomeanalyzer
sudo chmod -R 755 /var/www/genomeanalyzer

# Crear directorio para PDFs
mkdir -p /var/www/genomeanalyzer/pdfs
sudo chown -R www-data:www-data /var/www/genomeanalyzer/pdfs
```

## Paso 6: Configurar Firewall

```bash
# Habilitar ufw
sudo ufw enable

# Permitir SSH, HTTP, HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443

# Ver status
sudo ufw status
```

## Paso 7: Probar Aplicación

1. Abrir navegador: `http://tu-ip-publica`
2. Verificar que la aplicación cargue correctamente
3. Probar análisis de un genoma: NC_000001.11

## Paso 8: Configurar HTTPS (Recomendado)

### 8.1 Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-apache
```

### 8.2 Obtener Certificado SSL

```bash
sudo certbot --apache -d tu-dominio.com
```

Seguir las instrucciones en pantalla.

### 8.3 Renovación Automática

```bash
# Probar renovación
sudo certbot renew --dry-run

# Certbot configurará auto-renovación automáticamente
```

## Paso 9: Monitoreo y Logs

### Ver Logs de Apache

```bash
# Error log
sudo tail -f /var/log/apache2/genomeanalyzer_error.log

# Access log
sudo tail -f /var/log/apache2/genomeanalyzer_access.log
```

### Reiniciar Aplicación

```bash
sudo systemctl restart apache2
```

## Paso 10: Optimizaciones de Producción

### 10.1 Configurar Swap (si es necesario)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 10.2 Configurar Límites de Apache

Editar `/etc/apache2/mods-available/mpm_prefork.conf`:

```apache
<IfModule mpm_prefork_module>
    StartServers              5
    MinSpareServers           5
    MaxSpareServers          10
    MaxRequestWorkers       150
    MaxConnectionsPerChild    0
</IfModule>
```

Reiniciar:
```bash
sudo systemctl restart apache2
```

## Solución de Problemas

### Problema: El Agente IA no funciona (Error o no inicializado)

**Causas comunes:**
1. **Archivo .env no encontrado**: Apache/mod_wsgi a veces no carga el archivo `.env` si no se usa una ruta absoluta. He corregido esto en `config.py`.
2. **Variable de entorno faltante**: Asegúrate de que `GEMINI_API_KEY` esté configurado en el `.env` o en la configuración de Apache.

**Soluciones:**
1. **Verificar logs**: Busca errores de inicialización en:
   `sudo tail -f /var/log/apache2/genomeanalyzer_error.log`
   Busca líneas que empiecen por `INFO:`, `ERROR:` o `WARNING:`.
2. **Configurar en Apache**: Como alternativa, añade esto a tu `/etc/apache2/sites-available/genomeanalyzer.conf` dentro del bloque `<VirtualHost>`:
   ```apache
   SetEnv GEMINI_API_KEY "tu_api_key_aquí"
   SetEnv NCBI_EMAIL "tu_email@ejemplo.com"
   ```
3. **Probar conexión**: Accede a `http://tu-dominio.com/api/health` para ver si `ai_available` es `true`.

### Problema: Análisis muy lentos

**Soluciones:**
1. Aumentar tipo de instancia EC2 (t2.large o superior)
2. Configurar swap adicional
3. Optimizar Apache (mpm_prefork)

### Problema: No se generan PDFs

**Verificar:**
1. Directorio pdfs existe y tiene permisos: `ls -la /var/www/genomeanalyzer/pdfs`
2. Matplotlib y ReportLab instalados correctamente
3. Ver logs para errores específicos

## Comandos Útiles

```bash
# Reiniciar Apache
sudo systemctl restart apache2

# Ver status de Apache
sudo systemctl status apache2

# Activar entorno virtual
source /var/www/genomeanalyzer/venv/bin/activate

# Actualizar código (si usas git)
cd /var/www/genomeanalyzer
git pull
sudo systemctl restart apache2

# Ver uso de recursos
htop

# Ver espacio en disco
df -h
```

## Backup y Mantenimiento

### Backup Automático

Crear script `/home/ubuntu/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup de código
tar -czf $BACKUP_DIR/code_$DATE.tar.gz /var/www/genomeanalyzer

# Backup de PDFs generados
tar -czf $BACKUP_DIR/pdfs_$DATE.tar.gz /var/www/genomeanalyzer/pdfs

# Mantener solo últimos 7 días
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

Hacer ejecutable y añadir a cron:
```bash
chmod +x /home/ubuntu/backup.sh
crontab -e

# Añadir línea (backup diario a las 2 AM):
0 2 * * * /home/ubuntu/backup.sh
```

## Costos Estimados AWS

- **t2.medium** (~$0.046/hora): ~$33/mes
- **t2.large** (~$0.092/hora): ~$67/mes
- **Tráfico**: Primeros 100 GB gratis/mes

## Seguridad Adicional

1. Configurar fail2ban:
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

2. Actualizar regularmente:
```bash
sudo apt update && sudo apt upgrade -y
```

3. Configurar backups automáticos
4. Usar HTTPS siempre
5. Mantener API keys seguras en .env

---

¡Tu aplicación GenomeAnalyzer Pro estará lista en AWS con Apache!
