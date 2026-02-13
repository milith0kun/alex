"""
Módulo de integración con IA (Google Gemini) para interpretación biológica
"""
import google.generativeai as genai
from typing import Dict, Optional
import json


class AIInterpreter:
    """Interpreta análisis genómicos usando IA como un biólogo virtual"""
    
    def __init__(self, api_key: str):
        """
        Inicializa el intérprete AI
        
        Args:
            api_key: Google Gemini API key
        """
        if not api_key:
            raise ValueError("Se requiere GEMINI_API_KEY")
        
        genai.configure(api_key=api_key)
        # Usar gemini-1.5-flash (modelo estable y rápido)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
    
    def interpret_genome_analysis(self, analysis: Dict, language: str = 'es') -> Dict:
        """
        Interpreta el análisis de un genoma
        
        Args:
            analysis: Resultado de GenomeAnalyzer.analyze_genome()
            language: Idioma de la interpretación ('es' o 'en')
            
        Returns:
            Diccionario con interpretaciones científica y general
        """
        prompt = self._create_single_genome_prompt(analysis, language)
        
        try:
            response = self.model.generate_content(prompt)
            interpretation = response.text
            
            # Intentar separar interpretaciones científica y general
            parts = self._parse_interpretation(interpretation)
            
            return {
                'scientific_interpretation': parts.get('scientific', interpretation),
                'general_interpretation': parts.get('general', interpretation),
                'full_text': interpretation
            }
        except Exception as e:
            error_msg = str(e)
            
            # Detectar error de cuota excedida
            if '429' in error_msg or 'quota' in error_msg.lower() or 'rate' in error_msg.lower():
                friendly_msg = (
                    "⚠️ **Límite de API Alcanzado**\n\n"
                    "La interpretación con IA no está disponible temporalmente porque se alcanzó el límite gratuito de la API de Gemini.\n\n"
                    "**Opciones:**\n"
                    "- Esperar ~1 minuto y recargar la página\n"
                    "- Ver solo los datos numéricos (disponibles sin IA)\n"
                    "- Obtener una API key de pago en: https://ai.google.dev/\n\n"
                    "Los datos del genoma se muestran correctamente en las pestañas."
                )
            else:
                friendly_msg = f"⚠️ No se pudo generar la interpretación con IA: {error_msg[:100]}"
            
            return {
                'scientific_interpretation': friendly_msg,
                'general_interpretation': friendly_msg,
                'full_text': friendly_msg,
                'error': True
            }
    
    def interpret_comparison(self, comparison: Dict, genome1_analysis: Dict, 
                           genome2_analysis: Dict, language: str = 'es') -> Dict:
        """
        Interpreta la comparación entre dos genomas
        
        Args:
            comparison: Resultado de GenomeComparator.compare()
            genome1_analysis: Análisis del primer genoma
            genome2_analysis: Análisis del segundo genoma
            language: Idioma de la interpretación
            
        Returns:
            Diccionario con interpretaciones
        """
        prompt = self._create_comparison_prompt(comparison, genome1_analysis, 
                                                genome2_analysis, language)
        
        try:
            response = self.model.generate_content(prompt)
            interpretation = response.text
            
            parts = self._parse_interpretation(interpretation)
            
            return {
                'scientific_interpretation': parts.get('scientific', interpretation),
                'general_interpretation': parts.get('general', interpretation),
                'full_text': interpretation
            }
        except Exception as e:
            error_msg = str(e)
            
            # Detectar error de cuota excedida
            if '429' in error_msg or 'quota' in error_msg.lower() or 'rate' in error_msg.lower():
                friendly_msg = (
                    "⚠️ **Límite de API Alcanzado**\n\n"
                    "La interpretación con IA no está disponible temporalmente porque se alcanzó el límite gratuito de la API de Gemini.\n\n"
                    "**Opciones:**\n"
                    "- Esperar ~1 minuto y recargar la página\n"
                    "- Ver solo los datos numéricos de comparación (disponibles sin IA)\n"
                    "- Obtener una API key de pago en: https://ai.google.dev/\n\n"
                    "Los datos de comparación se muestran correctamente en las tablas."
                )
            else:
                friendly_msg = f"⚠️ No se pudo generar la interpretación con IA: {error_msg[:100]}"
            
            return {
                'scientific_interpretation': friendly_msg,
                'general_interpretation': friendly_msg,
                'full_text': friendly_msg,
                'error': True
            }
    
    def explain_genomic_modification(self, language: str = 'es') -> str:
        """
        Explica cómo funciona la modificación genómica
        
        Args:
            language: Idioma de la explicación
            
        Returns:
            Explicación detallada
        """
        if language == 'es':
            prompt = """
            Como biólogo experto, explica de manera clara y detallada cómo funciona la modificación genómica.
            Incluye:
            1. Conceptos básicos de modificación genómica
            2. Técnicas principales (CRISPR-Cas9, TALENs, etc.)
            3. Aplicaciones prácticas
            4. Consideraciones éticas
            5. Futuro de la tecnología
            
            Hazlo en dos secciones:
            
            CIENTÍFICA:
            [Explicación técnica para científicos]
            
            GENERAL:
            [Explicación accesible para el público general]
            """
        else:
            prompt = """
            As an expert biologist, explain clearly and in detail how genomic modification works.
            Include:
            1. Basic concepts of genomic modification
            2. Main techniques (CRISPR-Cas9, TALENs, etc.)
            3. Practical applications
            4. Ethical considerations
            5. Future of the technology
            
            Do it in two sections:
            
            SCIENTIFIC:
            [Technical explanation for scientists]
            
            GENERAL:
            [Accessible explanation for the general public]
            """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error al generar explicación: {str(e)}"
    
    def _create_single_genome_prompt(self, analysis: Dict, language: str) -> str:
        """Crea el prompt para análisis de un solo genoma"""
        if language == 'es':
            prompt = f"""
            Eres un biólogo experto especializado en genómica. Analiza los siguientes datos de un genoma:
            
            INFORMACIÓN BÁSICA:
            - ID: {analysis['accession_id']}
            - Organismo: {analysis['basic_info']['scientific_name']}
            - Longitud: {analysis['length']:,} pares de bases
            - Contenido GC: {analysis['gc_content']}%
            
            GENES:
            - Total CDS: {analysis['genes_analysis']['total_cds']}
            - Genes totales: {analysis['genes_analysis']['total_genes']}
            - Distancia promedio entre genes: {analysis['genes_analysis']['average_gene_distance']:.2f} pb
            
            CODONES:
            - Codones de inicio (ATG): {analysis['codons_analysis']['start_codons']['ATG']['total']} total
              ({analysis['codons_analysis']['start_codons']['ATG']['true']} verdaderos, 
               {analysis['codons_analysis']['start_codons']['ATG']['false']} falsos)
            - Codones STOP: {analysis['codons_analysis']['stop_codons']['total_true_stops']} verdaderos,
              {analysis['codons_analysis']['stop_codons']['total_false_stops']} falsos
            
            ESTRUCTURA GENÓMICA:
            - Genes con estructura intrón/exón: {analysis['introns_exons']['total_genes_analyzed']}
            
            Proporciona DOS interpretaciones separadas:
            
            CIENTÍFICA:
            [Análisis técnico detallado para científicos, incluyendo significado biológico de las métricas,
             comparación con estándares para este tipo de organismo, y características notables]
            
            GENERAL:
            [Explicación simple y accesible para alguien sin conocimientos de biología, usando analogías
             y evitando jerga técnica cuando sea posible]
            """
        else:
            prompt = f"""
            You are an expert biologist specialized in genomics. Analyze the following genome data:
            
            BASIC INFORMATION:
            - ID: {analysis['accession_id']}
            - Organism: {analysis['basic_info']['scientific_name']}
            - Length: {analysis['length']:,} base pairs
            - GC Content: {analysis['gc_content']}%
            
            GENES:
            - Total CDS: {analysis['genes_analysis']['total_cds']}
            - Total genes: {analysis['genes_analysis']['total_genes']}
            - Average distance between genes: {analysis['genes_analysis']['average_gene_distance']:.2f} bp
            
            CODONS:
            - Start codons (ATG): {analysis['codons_analysis']['start_codons']['ATG']['total']} total
              ({analysis['codons_analysis']['start_codons']['ATG']['true']} true, 
               {analysis['codons_analysis']['start_codons']['ATG']['false']} false)
            - STOP codons: {analysis['codons_analysis']['stop_codons']['total_true_stops']} true,
              {analysis['codons_analysis']['stop_codons']['total_false_stops']} false
            
            GENOMIC STRUCTURE:
            - Genes with intron/exon structure: {analysis['introns_exons']['total_genes_analyzed']}
            
            Provide TWO separate interpretations:
            
            SCIENTIFIC:
            [Detailed technical analysis for scientists]
            
            GENERAL:
            [Simple explanation for someone without biology knowledge]
            """
        
        return prompt
    
    def _create_comparison_prompt(self, comparison: Dict, genome1: Dict, 
                                  genome2: Dict, language: str) -> str:
        """Crea el prompt para comparación de genomas"""
        if language == 'es':
            prompt = f"""
            Eres un biólogo experto. Compara estos dos genomas:
            
            GENOMA 1: {comparison['genome1_id']}
            - Organismo: {genome1['basic_info']['scientific_name']}
            - Longitud: {comparison['comparisons']['length']['genome1']:,} pb
            - Contenido GC: {comparison['comparisons']['gc_content']['genome1']}%
            - Genes CDS: {comparison['comparisons']['genes']['genome1_cds']}
            
            GENOMA 2: {comparison['genome2_id']}
            - Organismo: {genome2['basic_info']['scientific_name']}
            - Longitud: {comparison['comparisons']['length']['genome2']:,} pb
            - Contenido GC: {comparison['comparisons']['gc_content']['genome2']}%
            - Genes CDS: {comparison['comparisons']['genes']['genome2_cds']}
            
            DIFERENCIAS:
            - Diferencia en longitud: {comparison['comparisons']['length']['difference']:,} pb ({comparison['comparisons']['length']['percent_diff']}%)
            - Diferencia en GC: {comparison['comparisons']['gc_content']['difference']}%
            - Diferencia en genes: {comparison['comparisons']['genes']['difference']}
            - Similitud general: {comparison['similarity']['overall_similarity']}%
            
            Proporciona DOS interpretaciones:
            
            CIENTÍFICA:
            [Análisis comparativo técnico, explicando el significado biológico de las diferencias,
             posibles implicaciones evolutivas, y características distintivas de cada genoma]
            
            GENERAL:
            [Explicación simple de en qué se parecen y diferencian estos genomas, usando analogías
             comprensibles para el público general]
            """
        else:
            prompt = f"""
            You are an expert biologist. Compare these two genomes:
            
            GENOME 1: {comparison['genome1_id']}
            - Organism: {genome1['basic_info']['scientific_name']}
            - Length: {comparison['comparisons']['length']['genome1']:,} bp
            - GC Content: {comparison['comparisons']['gc_content']['genome1']}%
            - CDS Genes: {comparison['comparisons']['genes']['genome1_cds']}
            
            GENOME 2: {comparison['genome2_id']}
            - Organism: {genome2['basic_info']['scientific_name']}
            - Length: {comparison['comparisons']['length']['genome2']:,} bp
            - GC Content: {comparison['comparisons']['gc_content']['genome2']}%
            - CDS Genes: {comparison['comparisons']['genes']['genome2_cds']}
            
            DIFFERENCES:
            - Length difference: {comparison['comparisons']['length']['difference']:,} bp ({comparison['comparisons']['length']['percent_diff']}%)
            - GC difference: {comparison['comparisons']['gc_content']['difference']}%
            - Gene difference: {comparison['comparisons']['genes']['difference']}
            - Overall similarity: {comparison['similarity']['overall_similarity']}%
            
            Provide TWO interpretations:
            
            SCIENTIFIC:
            [Technical comparative analysis]
            
            GENERAL:
            [Simple explanation for general public]
            """
        
        return prompt
    
    def _parse_interpretation(self, text: str) -> Dict:
        """Intenta separar las interpretaciones científica y general"""
        parts = {}
        
        # Buscar secciones - incluyendo variantes completas y cortas
        scientific_markers = [
            'INTERPRETACIÓN CIENTÍFICA',
            'CIENTÍFICA:',
            'SCIENTIFIC:',
            'Científica:',
            'Scientific:',
            'Interpretación Científica'
        ]
        general_markers = [
            'INTERPRETACIÓN GENERAL',
            'GENERAL:',
            'General:',
            'Interpretación General'
        ]
        
        scientific_start = -1
        scientific_marker_used = None
        general_start = -1
        general_marker_used = None
        
        for marker in scientific_markers:
            pos = text.find(marker)
            if pos != -1:
                scientific_start = pos
                scientific_marker_used = marker
                break
        
        for marker in general_markers:
            pos = text.find(marker)
            if pos != -1:
                general_start = pos
                general_marker_used = marker
                break
        
        if scientific_start != -1 and general_start != -1:
            if scientific_start < general_start:
                # Científica viene primero
                parts['scientific'] = text[scientific_start + len(scientific_marker_used):general_start].strip()
                parts['general'] = text[general_start + len(general_marker_used):].strip()
            else:
                # General viene primero
                parts['general'] = text[general_start + len(general_marker_used):scientific_start].strip()
                parts['scientific'] = text[scientific_start + len(scientific_marker_used):].strip()
        elif scientific_start != -1:
            parts['scientific'] = text[scientific_start + len(scientific_marker_used):].strip()
            parts['general'] = text[:scientific_start].strip()
        elif general_start != -1:
            parts['general'] = text[general_start + len(general_marker_used):].strip()
            parts['scientific'] = text[:general_start].strip()
        
        
        # Limpiar marcadores residuales de ambas secciones
        for key in parts:
            # Eliminar cualquier marcador que haya quedado al inicio o final
            for marker in scientific_markers + general_markers:
                parts[key] = parts[key].replace(marker, '').strip()
            
            # Eliminar separadores "---"
            parts[key] = parts[key].replace('---', '').strip()
            
            # Eliminar líneas que solo contengan marcadores o separadores
            lines = parts[key].split('\n')
            cleaned_lines = []
            for line in lines:
                stripped = line.strip()
                if stripped and stripped not in scientific_markers + general_markers and stripped != '---':
                    cleaned_lines.append(line)
            parts[key] = '\n'.join(cleaned_lines).strip()
        
        return parts

    def answer_question(self, question: str, genome_context: Dict = None, 
                        chat_history: list = None, language: str = 'es') -> Dict:
        """
        Responde preguntas del usuario como experto en biología y bioinformática.
        
        Args:
            question: Pregunta del usuario
            genome_context: Datos del genoma actual para contexto
            chat_history: Historial de la conversación
            language: Idioma de la respuesta
            
        Returns:
            Diccionario con la respuesta
        """
        try:
            # Construir el system prompt
            system_parts = []
            system_parts.append(
                "Eres un experto biólogo molecular y bioinformático con amplia experiencia en análisis genómico. "
                "Respondes preguntas de manera clara, precisa y profesional. "
                "Cuando sea apropiado, ofreces tanto una explicación técnica como una accesible para público general. "
                "Responde siempre en español. "
                "Usa formato con negritas (**texto**) para resaltar conceptos clave. "
                "Sé conciso pero completo en tus respuestas."
            )
            
            # Añadir contexto del genoma si está disponible
            if genome_context:
                context_str = "Contexto del genoma actualmente analizado:\n"
                if genome_context.get('organism'):
                    context_str += f"- Organismo: {genome_context['organism']}\n"
                if genome_context.get('accession'):
                    context_str += f"- Accession: {genome_context['accession']}\n"
                if genome_context.get('sequence_length'):
                    context_str += f"- Longitud de secuencia: {genome_context['sequence_length']} pb\n"
                if genome_context.get('gc_content'):
                    context_str += f"- Contenido GC: {genome_context['gc_content']}%\n"
                if genome_context.get('total_genes'):
                    context_str += f"- Total de genes: {genome_context['total_genes']}\n"
                if genome_context.get('description'):
                    context_str += f"- Descripción: {genome_context['description']}\n"
                system_parts.append(context_str)
                system_parts.append(
                    "Usa esta información del genoma para contextualizar tus respuestas cuando sea relevante."
                )
            
            # Construir los mensajes del historial
            prompt_parts = []
            prompt_parts.append('\n'.join(system_parts))
            
            # Incluir historial de conversación si existe
            if chat_history:
                prompt_parts.append("\nHistorial de la conversación:")
                for msg in chat_history[-6:]:  # últimos 6 mensajes
                    role = "Usuario" if msg.get('role') == 'user' else "Experto"
                    prompt_parts.append(f"{role}: {msg.get('content', '')}")
            
            prompt_parts.append(f"\nUsuario: {question}")
            prompt_parts.append("\nExperto:")
            
            full_prompt = '\n'.join(prompt_parts)
            
            response = self.model.generate_content(full_prompt)
            answer = response.text.strip()
            
            return {
                'success': True,
                'answer': answer
            }
            
        except Exception as e:
            error_msg = str(e)
            if '429' in error_msg or 'quota' in error_msg.lower() or 'rate' in error_msg.lower():
                return {
                    'success': False,
                    'answer': '⚠️ Límite de API alcanzado. Espera un momento e intenta de nuevo.'
                }
            return {
                'success': False,
                'answer': f'⚠️ Error al generar respuesta: {error_msg[:150]}'
            }
