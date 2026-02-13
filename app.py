"""
Aplicación Flask principal para análisis de genomas
"""
from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from config import get_config
from genome_analyzer import GenomeAnalyzer, GenomeComparator
from ai_interpreter import AIInterpreter
from pdf_generator import PDFGenerator
import os
import json
import traceback
from datetime import datetime

app = Flask(__name__)
app.config.from_object(get_config())
CORS(app)

# Configuración del mapa conceptual
MAPA_DATA_DIR = os.path.join(app.root_path, 'data')
MAPA_FILE_PATH = os.path.join(MAPA_DATA_DIR, 'mapa_conceptual.json')
EDIT_PASSWORD = "mapa123"

# Asegurar que el directorio de datos existe
if not os.path.exists(MAPA_DATA_DIR):
    os.makedirs(MAPA_DATA_DIR)

def get_mapas_assets():
    manifest_path = os.path.join(app.root_path, 'static', 'mapas', '.vite', 'manifest.json')
    if not os.path.exists(manifest_path):
        manifest_path = os.path.join(app.root_path, 'static', 'mapas', 'manifest.json')
        if not os.path.exists(manifest_path):
            return {'js': None, 'css': []}
    with open(manifest_path, 'r', encoding='utf-8') as manifest_file:
        manifest = json.load(manifest_file)
    entry = None
    for value in manifest.values():
        if value.get('isEntry'):
            entry = value
            break
    if not entry:
        return {'js': None, 'css': []}
    return {
        'js': entry.get('file'),
        'css': entry.get('css', [])
    }

# Inicializar analizador y AI
analyzer = GenomeAnalyzer(
    email=app.config['NCBI_EMAIL'],
    api_key=app.config.get('NCBI_API_KEY')
)

ai_interpreter = None
if app.config['GEMINI_API_KEY']:
    try:
        print(f"INFO: Inicializando AI Interpreter con API Key: {app.config['GEMINI_API_KEY'][:5]}***")
        ai_interpreter = AIInterpreter(app.config['GEMINI_API_KEY'])
        print("INFO: AI Interpreter inicializado correctamente")
    except Exception as e:
        print(f"ERROR: No se pudo inicializar AI Interpreter: {e}")
else:
    print("WARNING: GEMINI_API_KEY no encontrada en la configuración")


@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')


@app.route('/mapas')
def mapas():
    assets = get_mapas_assets()
    return render_template('mapas.html', mapas_js=assets['js'], mapas_css=assets['css'])

# Endpoints para el Mapa Conceptual
@app.route('/api/mapa', methods=['GET'])
def get_mapa():
    """Devuelve el JSON del mapa conceptual"""
    try:
        if os.path.exists(MAPA_FILE_PATH):
            with open(MAPA_FILE_PATH, 'r', encoding='utf-8') as f:
                content = f.read()
                if content.strip():
                    return jsonify(json.loads(content))
        
        # Si el archivo no existe o está vacío, devolver initialData desde el frontend
        # (El frontend manejará esto cargando initialData si recibe un objeto vacío o nulo)
        return jsonify({"nodes": [], "edges": []})
    except Exception as e:
        print(f"Error en get_mapa: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/mapa', methods=['POST'])
def save_mapa():
    """Guarda el JSON del mapa conceptual (requiere contraseña)"""
    try:
        data = request.get_json()
        password = data.get('password')
        mapa_data = data.get('data')

        if password != EDIT_PASSWORD:
            return jsonify({"error": "Contraseña incorrecta"}), 401

        with open(MAPA_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(mapa_data, f, indent=4, ensure_ascii=False)

        return jsonify({"message": "Cambios guardados correctamente"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mapa/verify', methods=['POST'])
def verify_mapa_password():
    """Verifica si la contraseña de edición es correcta"""
    data = request.get_json()
    if data.get('password') == EDIT_PASSWORD:
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Contraseña incorrecta"}), 401


@app.route('/api/analyze', methods=['POST'])
def analyze_genome():
    """
    Analiza un genoma individual
    
    Request JSON:
        {
            "genome_id": "NC_000001.11",
            "include_ai": true
        }
    """
    try:
        data = request.get_json()
        genome_id = data.get('genome_id')
        include_ai = data.get('include_ai', False)
        
        if not genome_id:
            return jsonify({'error': 'Se requiere genome_id'}), 400
        
        # Analizar genoma
        analysis = analyzer.analyze_genome(genome_id)
        
        # Interpretación de IA (opcional)
        ai_result = None
        if include_ai and ai_interpreter:
            try:
                ai_result = ai_interpreter.interpret_genome_analysis(analysis)
            except Exception as e:
                print(f"Error en interpretación AI: {e}")
                ai_result = {
                    'error': f'Error en análisis de IA: {str(e)}'
                }
        
        return jsonify({
            'success': True,
            'analysis': analysis,
            'ai_interpretation': ai_result
        })
    
    except Exception as e:
        print(f"Error en análisis: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': str(e),
            'details': traceback.format_exc()
        }), 500


@app.route('/api/compare', methods=['POST'])
def compare_genomes():
    """
    Compara dos genomas
    
    Request JSON:
        {
            "genome1_id": "NC_000001.11",
            "genome2_id": "NC_000002.12",
            "include_ai": true
        }
    """
    try:
        data = request.get_json()
        genome1_id = data.get('genome1_id')
        genome2_id = data.get('genome2_id')
        include_ai = data.get('include_ai', False)
        
        if not genome1_id or not genome2_id:
            return jsonify({'error': 'Se requieren genome1_id y genome2_id'}), 400
        
        # Analizar ambos genomas
        print(f"Analizando genoma 1: {genome1_id}")
        analysis1 = analyzer.analyze_genome(genome1_id)
        
        print(f"Analizando genoma 2: {genome2_id}")
        analysis2 = analyzer.analyze_genome(genome2_id)
        
        # Comparar
        print("Comparando genomas...")
        comparison = GenomeComparator.compare(analysis1, analysis2)
        
        # Interpretación de IA (opcional)
        ai_result = None
        if include_ai and ai_interpreter:
            try:
                ai_result = ai_interpreter.interpret_comparison(
                    comparison, analysis1, analysis2
                )
            except Exception as e:
                print(f"Error en interpretación AI: {e}")
                ai_result = {
                    'error': f'Error en análisis de IA: {str(e)}'
                }
        
        return jsonify({
            'success': True,
            'genome1': analysis1,
            'genome2': analysis2,
            'comparison': comparison,
            'ai_interpretation': ai_result
        })
    
    except Exception as e:
        print(f"Error en comparación: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': str(e),
            'details': traceback.format_exc()
        }), 500


@app.route('/api/ai-chat', methods=['POST'])
def ai_chat():
    """
    Chat interactivo con IA experta en biología y bioinformática.
    
    Request JSON:
        {
            "question": "¿Qué función tiene este genoma?",
            "genome_context": { ... },  // Datos del genoma actual
            "chat_history": [ ... ]  // Historial de mensajes
        }
    """
    try:
        if not ai_interpreter:
            return jsonify({
                'success': False,
                'answer': '⚠️ AI Interpreter no está configurado. Verifica tu GEMINI_API_KEY.'
            }), 503
        
        data = request.get_json()
        question = data.get('question', '').strip()
        genome_context = data.get('genome_context')
        chat_history = data.get('chat_history', [])
        
        if not question:
            return jsonify({
                'success': False,
                'answer': 'Por favor, escribe una pregunta.'
            }), 400
        
        result = ai_interpreter.answer_question(
            question=question,
            genome_context=genome_context,
            chat_history=chat_history
        )
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Error en AI chat: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'answer': f'⚠️ Error interno: {str(e)[:150]}'
        }), 500


@app.route('/api/genomic-modification-info', methods=['GET'])
def genomic_modification_info():
    """
    Obtiene información sobre modificación genómica
    """
    try:
        if not ai_interpreter:
            return jsonify({
                'error': 'AI Interpreter no está configurado'
            }), 503
        
        explanation = ai_interpreter.explain_genomic_modification()
        
        return jsonify({
            'success': True,
            'explanation': explanation
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/download-pdf', methods=['POST'])
def download_pdf():
    """
    Genera y descarga un PDF con el análisis
    
    Request JSON:
        {
            "type": "single" | "comparison",
            "data": { ... },  // Datos del análisis
            "ai_interpretation": { ... }  // Opcional
        }
    """
    try:
        data = request.get_json()
        report_type = data.get('type')
        analysis_data = data.get('data')
        ai_data = data.get('ai_interpretation')
        
        if not report_type or not analysis_data:
            return jsonify({'error': 'Se requieren type y data'}), 400
        
        # Crear directorio para PDFs si no existe
        pdf_dir = os.path.join(os.path.dirname(__file__), 'pdfs')
        os.makedirs(pdf_dir, exist_ok=True)
        
        # Generar nombre de archivo
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"genome_analysis_{timestamp}.pdf"
        filepath = os.path.join(pdf_dir, filename)
        
        # Generar PDF
        pdf_gen = PDFGenerator(filepath)
        
        if report_type == 'single':
            pdf_gen.generate_single_genome_report(
                analysis_data,
                ai_data
            )
        elif report_type == 'comparison':
            genome1 = data.get('genome1')
            genome2 = data.get('genome2')
            
            if not genome1 or not genome2:
                return jsonify({'error': 'Se requieren genome1 y genome2'}), 400
            
            pdf_gen.generate_comparison_report(
                analysis_data,
                genome1,
                genome2,
                ai_data
            )
        else:
            return jsonify({'error': 'Tipo inválido'}), 400
        
        # Enviar archivo
        return send_file(
            filepath,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
    
    except Exception as e:
        print(f"Error generando PDF: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'ai_available': ai_interpreter is not None,
        'ncbi_email_configured': bool(app.config['NCBI_EMAIL'])
    })


@app.errorhandler(404)
def not_found(error):
    """Manejo de 404"""
    return jsonify({'error': 'Endpoint no encontrado'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Manejo de errores del servidor"""
    return jsonify({'error': 'Error interno del servidor'}), 500


if __name__ == '__main__':
    # Modo desarrollo
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
