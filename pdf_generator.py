"""
Módulo de generación de PDFs con formato IEGE
"""
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.platypus import KeepTogether
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas
import matplotlib
matplotlib.use('Agg')  # Backend sin GUI
import matplotlib.pyplot as plt
from io import BytesIO
from datetime import datetime
from typing import Dict, Optional
import os


class PDFGenerator:
    """Genera PDFs profesionales con análisis genómico en formato IEGE"""
    
    def __init__(self, output_path: str):
        """
        Inicializa el generador de PDF
        
        Args:
            output_path: Ruta donde guardar el PDF
        """
        self.output_path = output_path
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Configura estilos personalizados para el PDF"""
        # Título principal
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a237e'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Subtítulo
        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#283593'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        ))
        
        # Sección
        self.styles.add(ParagraphStyle(
            name='Section',
            parent=self.styles['Heading3'],
            fontSize=12,
            textColor=colors.HexColor('#3949ab'),
            spaceAfter=8,
            spaceBefore=8,
            fontName='Helvetica-Bold'
        ))
        
        # Texto normal
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['Normal'],
            fontSize=10,
            alignment=TA_JUSTIFY,
            spaceAfter=6
        ))
    
    def generate_single_genome_report(self, analysis: Dict, 
                                     ai_interpretation: Optional[Dict] = None) -> str:
        """
        Genera un reporte PDF de un genoma individual
        
        Args:
            analysis: Resultado de GenomeAnalyzer.analyze_genome()
            ai_interpretation: Interpretación de IA (opcional)
            
        Returns:
            Ruta del archivo PDF generado
        """
        doc = SimpleDocTemplate(self.output_path, pagesize=letter,
                               rightMargin=72, leftMargin=72,
                               topMargin=72, bottomMargin=18)
        
        story = []
        
        # Portada
        story.extend(self._create_cover_page(analysis))
        story.append(PageBreak())
        
        # Índice
        story.extend(self._create_table_of_contents())
        story.append(PageBreak())
        
        # Resumen Ejecutivo
        story.extend(self._create_executive_summary(analysis))
        
        # Información Básica
        story.extend(self._create_basic_info_section(analysis))
        story.append(PageBreak())
        
        # Análisis de Genes
        story.extend(self._create_gene_analysis_section(analysis))
        
        # Análisis de Codones
        story.extend(self._create_codon_analysis_section(analysis))
        
        # Frecuencia de los 64 Codones
        story.append(PageBreak())
        story.extend(self._create_codon_frequency_section(analysis))
        
        # Distribución Genómica
        story.extend(self._create_distribution_section(analysis))
        
        # Estructura Genómica (Intrones/Exones)
        story.extend(self._create_structure_section(analysis))
        
        # Modificación Genómica
        story.append(PageBreak())
        story.extend(self._create_genomic_modification_section())
        
        # Interpretación de IA
        if ai_interpretation:
            story.append(PageBreak())
            story.extend(self._create_ai_interpretation_section(ai_interpretation))
        
        # Construir PDF
        doc.build(story)
        return self.output_path
    
    def generate_comparison_report(self, comparison: Dict, genome1: Dict, 
                                   genome2: Dict, 
                                   ai_interpretation: Optional[Dict] = None) -> str:
        """
        Genera un reporte PDF de comparación de genomas
        
        Args:
            comparison: Resultado de GenomeComparator.compare()
            genome1: Análisis del primer genoma
            genome2: Análisis del segundo genoma
            ai_interpretation: Interpretación de IA (opcional)
            
        Returns:
            Ruta del archivo PDF generado
        """
        doc = SimpleDocTemplate(self.output_path, pagesize=letter,
                               rightMargin=72, leftMargin=72,
                               topMargin=72, bottomMargin=18)
        
        story = []
        
        # Portada
        story.extend(self._create_comparison_cover(comparison, genome1, genome2))
        story.append(PageBreak())
        
        # Resumen de Comparación
        story.extend(self._create_comparison_summary(comparison, genome1, genome2))
        story.append(PageBreak())
        
        # Comparación Detallada
        story.extend(self._create_detailed_comparison(comparison, genome1, genome2))
        
        # Interpretación de IA
        if ai_interpretation:
            story.append(PageBreak())
            story.extend(self._create_ai_interpretation_section(ai_interpretation))
        
        doc.build(story)
        return self.output_path
    
    def _create_cover_page(self, analysis: Dict) -> list:
        """Crea la portada del reporte"""
        elements = []
        
        # Espaciado
        elements.append(Spacer(1, 2*inch))
        
        # Título
        title = Paragraph("REPORTE DE ANÁLISIS GENÓMICO", self.styles['CustomTitle'])
        elements.append(title)
        elements.append(Spacer(1, 0.5*inch))
        
        # Información del genoma
        info_text = f"""
        <b>ID de Acceso:</b> {analysis['accession_id']}<br/>
        <b>Organismo:</b> {analysis['basic_info']['scientific_name']}<br/>
        <b>Fecha de Análisis:</b> {datetime.now().strftime('%d/%m/%Y %H:%M')}
        """
        info = Paragraph(info_text, self.styles['CustomBody'])
        elements.append(info)
        
        elements.append(Spacer(1, 1*inch))
        
        # Formato IEGE
        footer_text = "<b>Formato IEGE - Instituto de Estudios Genómicos</b>"
        footer = Paragraph(footer_text, self.styles['CustomBody'])
        elements.append(footer)
        
        return elements
    
    def _create_comparison_cover(self, comparison: Dict, genome1: Dict, genome2: Dict) -> list:
        """Crea portada para reporte de comparación"""
        elements = []
        
        elements.append(Spacer(1, 2*inch))
        
        title = Paragraph("REPORTE DE COMPARACIÓN GENÓMICA", self.styles['CustomTitle'])
        elements.append(title)
        elements.append(Spacer(1, 0.5*inch))
        
        info_text = f"""
        <b>Genoma 1:</b> {comparison['genome1_id']} - {genome1['basic_info']['scientific_name']}<br/>
        <b>Genoma 2:</b> {comparison['genome2_id']} - {genome2['basic_info']['scientific_name']}<br/>
        <b>Similitud General:</b> {comparison['similarity']['overall_similarity']}%<br/>
        <b>Fecha de Análisis:</b> {datetime.now().strftime('%d/%m/%Y %H:%M')}
        """
        info = Paragraph(info_text, self.styles['CustomBody'])
        elements.append(info)
        
        elements.append(Spacer(1, 1*inch))
        
        footer_text = "<b>Formato IEGE - Instituto de Estudios Genómicos</b>"
        footer = Paragraph(footer_text, self.styles['CustomBody'])
        elements.append(footer)
        
        return elements
    
    def _create_table_of_contents(self) -> list:
        """Crea el índice"""
        elements = []
        
        elements.append(Paragraph("ÍNDICE", self.styles['CustomHeading']))
        elements.append(Spacer(1, 0.2*inch))
        
        toc_items = [
            "1. Resumen Ejecutivo",
            "2. Información Básica del Genoma",
            "3. Análisis de Genes y CDS",
            "4. Análisis de Codones de Inicio/STOP",
            "5. Frecuencia de los 64 Codones",
            "6. Distribución Genómica",
            "7. Estructura Genómica (Intrones/Exones)",
            "8. Modificación Genómica",
            "9. Interpretación por IA"
        ]
        
        for item in toc_items:
            elements.append(Paragraph(item, self.styles['CustomBody']))
            elements.append(Spacer(1, 0.1*inch))
        
        return elements
    
    def _create_executive_summary(self, analysis: Dict) -> list:
        """Crea el resumen ejecutivo"""
        elements = []
        
        elements.append(Paragraph("1. RESUMEN EJECUTIVO", self.styles['CustomHeading']))
        elements.append(Spacer(1, 0.2*inch))
        
        summary_text = f"""
        Este reporte presenta un análisis completo del genoma <b>{analysis['accession_id']}</b> 
        correspondiente al organismo <b>{analysis['basic_info']['scientific_name']}</b>.
        <br/><br/>
        <b>Características Principales:</b><br/>
        • Longitud total: {analysis['length']:,} pares de bases<br/>
        • Contenido GC: {analysis['gc_content']}%<br/>
        • Total de genes CDS: {analysis['genes_analysis']['total_cds']}<br/>
        • Distancia promedio entre genes: {analysis['genes_analysis']['average_gene_distance']:.2f} pb<br/>
        """
        
        elements.append(Paragraph(summary_text, self.styles['CustomBody']))
        elements.append(Spacer(1, 0.3*inch))
        
        return elements
    
    def _create_basic_info_section(self, analysis: Dict) -> list:
        """Crea la sección de información básica"""
        elements = []
        
        elements.append(Paragraph("2. INFORMACIÓN BÁSICA DEL GENOMA", self.styles['CustomHeading']))
        elements.append(Spacer(1, 0.2*inch))
        
        # Tabla de información
        taxonomy = " > ".join(analysis['basic_info']['taxonomy'][-5:])
        common = ", ".join(analysis['basic_info']['common_names'][:3]) if analysis['basic_info']['common_names'] else "N/A"
        
        data = [
            ['Característica', 'Valor'],
            ['ID de Acceso', analysis['accession_id']],
            ['Nombre Científico', analysis['basic_info']['scientific_name']],
            ['Nombres Comunes', common],
            ['Descripción', analysis['basic_info']['description'][:150] + '...'],
            ['Taxonomía (últimos 5 levels)', taxonomy],
            ['Longitud (pb)', f"{analysis['length']:,}"],
            ['Contenido GC (%)', f"{analysis['gc_content']}%"]
        ]
        
        table = Table(data, colWidths=[2.5*inch, 4*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3949ab')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 0.3*inch))
        
        return elements
    
    def _create_gene_analysis_section(self, analysis: Dict) -> list:
        """Crea la sección de análisis de genes y CDS"""
        elements = []
        elements.append(Paragraph("3. ANÁLISIS DE GENES Y CDS", self.styles['CustomHeading']))
        elements.append(Spacer(1, 0.2*inch))
        
        genes = analysis['genes_analysis']
        
        data_summary = [
            ['Métrica', 'Valor'],
            ['Total de Genes CDS (Coding Sequences)', str(genes['total_cds'])],
            ['Total de Genes Anotados', str(genes['total_genes'])],
            ['Distancia Promedio entre Genes', f"{genes['average_gene_distance']:.2f} pb"],
            ['Distancia Mínima', f"{genes['min_gene_distance']} pb"],
            ['Distancia Máxima', f"{genes['max_gene_distance']} pb"]
        ]
        
        table_sum = Table(data_summary, colWidths=[3.5*inch, 3*inch])
        table_sum.setStyle(self._get_standard_table_style())
        elements.append(table_sum)
        elements.append(Spacer(1, 0.2*inch))
        
        # Lista detallada (Top 20 por longitud)
        elements.append(Paragraph("Top 20 Genes más largos:", self.styles['Section']))
        cds_sorted = sorted(genes['cds_details'], key=lambda x: x['length'], reverse=True)[:20]
        
        header = ['Gen', 'Producto', 'Longitud (pb)', 'Proteína (aa)']
        table_data = [header]
        for cds in cds_sorted:
            table_data.append([
                cds['gene'][:15],
                cds['product'][:35],
                f"{cds['length']:,}",
                f"{cds['protein_length']:,}"
            ])
            
        table_genes = Table(table_data, colWidths=[1.2*inch, 3*inch, 1.1*inch, 1.2*inch])
        table_genes.setStyle(self._get_standard_table_style())
        elements.append(table_genes)
        
        elements.append(Spacer(1, 0.3*inch))
        return elements
    
    def _create_codon_analysis_section(self, analysis: Dict) -> list:
        """Crea la sección de análisis de codones de inicio/STOP"""
        elements = []
        elements.append(Paragraph("4. ANÁLISIS DE CODONES DE INICIO/STOP", self.styles['CustomHeading']))
        elements.append(Spacer(1, 0.2*inch))
        
        codons = analysis['codons_analysis']
        start = codons['start_codons']['ATG']
        stop = codons['stop_codons']
        
        # Codones de inicio
        elements.append(Paragraph("4.1 Codones de Inicio y Uso", self.styles['Section']))
        
        usage = codons.get('start_codon_usage', {})
        total_usage = usage.get('total', 1) or 1  # Avoid division by zero
        data_usage = [
            ['Codón', 'Uso Funcional (%)'],
            ['ATG (Metionina)', f"{usage.get('ATG', 0)} ({usage.get('ATG', 0)/total_usage*100:.1f}%)"],
            ['GTG (Valina)', f"{usage.get('GTG', 0)} ({usage.get('GTG', 0)/total_usage*100:.1f}%)"],
            ['TTG (Leucina)', f"{usage.get('TTG', 0)} ({usage.get('TTG', 0)/total_usage*100:.1f}%)"],
            ['Otros', f"{usage.get('other', 0)} ({usage.get('other', 0)/total_usage*100:.1f}%)"]
        ]
        
        table_usage = Table(data_usage, colWidths=[3.5*inch, 3*inch])
        table_usage.setStyle(self._get_standard_table_style())
        elements.append(table_usage)
        elements.append(Spacer(1, 0.2*inch))
        
        data_atg = [
            ['Ubicación de ATG', 'Cantidad'],
            ['Total encontrados', str(start['total'])],
            ['En regiones codificantes (True)', str(start['true'])],
            ['Fuera de regiones (False)', str(start['false'])]
        ]
        
        table_atg = Table(data_atg, colWidths=[3.5*inch, 3*inch])
        table_atg.setStyle(self._get_standard_table_style())
        elements.append(table_atg)
        elements.append(Spacer(1, 0.2*inch))
        
        # Codones STOP
        elements.append(Paragraph("4.2 Codones STOP (TAA, TAG, TGA)", self.styles['Section']))
        
        data_stop = [
            ['Tipo', 'Cantidad', 'Funcionales'],
            ['TAA (Ocre)', str(stop['TAA']['total']), str(stop['TAA']['functional'])],
            ['TAG (Ámbar)', str(stop['TAG']['total']), str(stop['TAG']['functional'])],
            ['TGA (Ópalo)', str(stop['TGA']['total']), str(stop['TGA']['functional'])],
            ['Verdaderos (en CDS)', str(stop['total_true_stops']), '-'],
            ['Falsos (fuera de CDS)', str(stop['total_false_stops']), '-']
        ]
        
        table_stop = Table(data_stop, colWidths=[2.5*inch, 2*inch, 2*inch])
        table_stop.setStyle(self._get_standard_table_style())
        elements.append(table_stop)
        elements.append(Spacer(1, 0.3*inch))
        
        return elements

    def _create_codon_frequency_section(self, analysis: Dict) -> list:
        """Crea la sección de frecuencia de los 64 codones"""
        elements = []
        
        elements.append(Paragraph("5. FRECUENCIA DE LOS 64 CODONES", self.styles['CustomHeading']))
        elements.append(Spacer(1, 0.1*inch))
        
        codon_data = analysis['codon_frequency_64']['codons']
        
        # Preparar datos para tabla 4x16
        header = ['Codón', 'AA', 'Frec %', '|', 'Codón', 'AA', 'Frec %', '|', 'Codón', 'AA', 'Frec %']
        table_rows = [header]
        
        # Ordenar codones por orden alfabético
        sorted_codons = sorted(codon_data.keys())
        
        # Dividir en 3 columnas para que quepa en la página
        num_codons = len(sorted_codons)
        cols = 3
        rows_per_col = (num_codons + cols - 1) // cols
        
        for i in range(rows_per_col):
            row = []
            for j in range(cols):
                idx = i + j * rows_per_col
                if idx < num_codons:
                    c = sorted_codons[idx]
                    d = codon_data[c]
                    row.extend([c, d['amino_acid'], f"{d['frequency']:.2f}"])
                    if j < cols - 1:
                        row.append('|')
                else:
                    row.extend(['', '', ''])
                    if j < cols - 1:
                        row.append('|')
            table_rows.append(row)
            
        table_freq = Table(table_rows, colWidths=[0.6*inch, 0.6*inch, 0.7*inch, 0.1*inch, 
                                                 0.6*inch, 0.6*inch, 0.7*inch, 0.1*inch,
                                                 0.6*inch, 0.6*inch, 0.7*inch])
        
        table_freq.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3949ab')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('BACKGROUND', (3, 0), (3, -1), colors.lightgrey),
            ('BACKGROUND', (7, 0), (7, -1), colors.lightgrey),
        ]))
        
        elements.append(table_freq)
        elements.append(Spacer(1, 0.3*inch))
        
        return elements
    
    def _create_distribution_section(self, analysis: Dict) -> list:
        """Crea la sección de distribución genómica con gráfico"""
        elements = []
        
        elements.append(Paragraph("6. DISTRIBUCIÓN GENÓMICA", self.styles['CustomHeading']))
        elements.append(Spacer(1, 0.2*inch))
        
        # Crear gráfico de distribución
        distribution = analysis['gene_distribution']
        regions = [r['region'] for r in distribution['regions']]
        counts = [r['gene_count'] for r in distribution['regions']]
        
        fig, ax = plt.subplots(figsize=(8, 4))
        ax.bar(regions, counts, color='#3949ab', alpha=0.7)
        ax.set_xlabel('Región del Genoma')
        ax.set_ylabel('Número de Genes')
        ax.set_title('Distribución de Genes a lo Largo del Genoma')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        
        # Guardar gráfico en memoria
        img_buffer = BytesIO()
        plt.savefig(img_buffer, format='png', dpi=150)
        img_buffer.seek(0)
        plt.close()
        
        # Añadir imagen al PDF
        img = Image(img_buffer, width=6*inch, height=3*inch)
        elements.append(img)
        elements.append(Spacer(1, 0.3*inch))
        
        return elements
    
    def _create_structure_section(self, analysis: Dict) -> list:
        """Crea la sección de estructura genómica"""
        elements = []
        
        elements.append(Paragraph("7. ESTRUCTURA GENÓMICA (INTRONES/EXONES)", 
                                 self.styles['CustomHeading']))
        elements.append(Spacer(1, 0.2*inch))
        
        introns_exons = analysis['introns_exons']
        
        text = f"""
        Se analizaron <b>{introns_exons['total_genes_analyzed']}</b> genes con estructura 
        de intrones y exones definida.
        """
        
        elements.append(Paragraph(text, self.styles['CustomBody']))
        elements.append(Spacer(1, 0.2*inch))
        
        # Mostrar algunos ejemplos
        if introns_exons['genes_with_structure']:
            elements.append(Paragraph("Ejemplos de Genes con Estructura:", 
                                     self.styles['Section']))
            
            for gene_data in introns_exons['genes_with_structure'][:5]:
                gene_text = f"""
                <b>Gen:</b> {gene_data['gene']}<br/>
                • Exones: {gene_data['exon_count']}<br/>
                • Intrones: {gene_data['intron_count']}<br/>
                """
                elements.append(Paragraph(gene_text, self.styles['CustomBody']))
                elements.append(Spacer(1, 0.1*inch))
        
        elements.append(Spacer(1, 0.3*inch))
        
        # Mostrar resumen de splicing
        elements.append(Paragraph("Resumen de Sitios de Splicing (GT-AG):", self.styles['Section']))
        data_splice = [
            ['Métrica', 'Valor'],
            ['Total Intrones Detectados', str(introns_exons['total_introns'])],
            ['Intrones Canónicos (GT-AG)', str(introns_exons['canonical_introns'])],
            ['Porcentaje de Canónicos', f"{introns_exons['canonical_percentage']}%"]
        ]
        table_splice = Table(data_splice, colWidths=[3.5*inch, 3*inch])
        table_splice.setStyle(self._get_standard_table_style())
        elements.append(table_splice)
        
        return elements
    
    def _create_genomic_modification_section(self) -> list:
        """Crea la sección sobre modificación genómica"""
        elements = []
        
        elements.append(Paragraph("8. MODIFICACIÓN GENÓMICA", self.styles['CustomHeading']))
        elements.append(Spacer(1, 0.2*inch))
        
        text = """
        <b>¿Qué es la Modificación Genómica?</b><br/><br/>
        
        La modificación genómica es el proceso de alterar deliberadamente el ADN de un organismo 
        para cambiar sus características. Las técnicas modernas como CRISPR-Cas9 permiten realizar 
        ediciones precisas en el genoma.<br/><br/>
        
        <b>Técnicas Principales:</b><br/>
        • <b>CRISPR-Cas9:</b> Sistema de edición genética que actúa como "tijeras moleculares" 
        para cortar y modificar secuencias específicas de ADN.<br/>
        • <b>TALENs:</b> Nucleasas activadoras de transcripción que pueden diseñarse para 
        reconocer y cortar secuencias específicas de ADN.<br/>
        • <b>ZFNs:</b> Nucleasas de dedos de zinc que combinan un dominio de unión a ADN 
        con una nucleasa para modificar genes específicos.<br/><br/>
        
        <b>Aplicaciones:</b><br/>
        • Tratamiento de enfermedades genéticas<br/>
        • Mejoramiento de cultivos agrícolas<br/>
        • Desarrollo de nuevos medicamentos<br/>
        • Investigación básica en biología<br/><br/>
        
        <b>Consideraciones Éticas:</b><br/>
        La modificación genómica plantea importantes cuestiones éticas sobre los límites de 
        la intervención humana en la naturaleza, especialmente en aplicaciones como la edición 
        de línea germinal en humanos.
        """
        
        elements.append(Paragraph(text, self.styles['CustomBody']))
        elements.append(Spacer(1, 0.3*inch))
        
        return elements
    
    def _create_ai_interpretation_section(self, ai_interpretation: Dict) -> list:
        """Crea la sección de interpretación por IA"""
        elements = []
        
        elements.append(Paragraph("9. INTERPRETACIÓN POR IA (BIÓLOGO VIRTUAL)", 
                                 self.styles['CustomHeading']))
        elements.append(Spacer(1, 0.2*inch))
        
        # Interpretación científica
        elements.append(Paragraph("9.1 Interpretación Científica", self.styles['Section']))
        scientific = ai_interpretation.get('scientific_interpretation', 'No disponible')
        elements.append(Paragraph(scientific, self.styles['CustomBody']))
        elements.append(Spacer(1, 0.2*inch))
        
        # Interpretación general
        elements.append(Paragraph("8.2 Interpretación para Público General", 
                                 self.styles['Section']))
        general = ai_interpretation.get('general_interpretation', 'No disponible')
        elements.append(Paragraph(general, self.styles['CustomBody']))
        elements.append(Spacer(1, 0.3*inch))
        
        return elements
    
    def _create_comparison_summary(self, comparison: Dict, genome1: Dict, genome2: Dict) -> list:
        """Crea el resumen de comparación"""
        elements = []
        
        elements.append(Paragraph("RESUMEN DE COMPARACIÓN", self.styles['CustomHeading']))
        elements.append(Spacer(1, 0.2*inch))
        
        comp = comparison['comparisons']
        sim = comparison['similarity']
        
        data = [
            ['Métrica', genome1['basic_info']['scientific_name'], 
             genome2['basic_info']['scientific_name'], 'Diferencia'],
            ['Longitud (pb)', f"{comp['length']['genome1']:,}", 
             f"{comp['length']['genome2']:,}", 
             f"{comp['length']['difference']:,} ({comp['length']['percent_diff']}%)"],
            ['Contenido GC (%)', f"{comp['gc_content']['genome1']}%", 
             f"{comp['gc_content']['genome2']}%", 
             f"{comp['gc_content']['difference']}%"],
            ['Genes CDS', str(comp['genes']['genome1_cds']), 
             str(comp['genes']['genome2_cds']), 
             str(comp['genes']['difference'])],
            ['Similitud General', '', '', f"{sim['overall_similarity']}%"]
        ]
        
        table = Table(data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        table.setStyle(self._get_standard_table_style())
        
        elements.append(table)
        elements.append(Spacer(1, 0.3*inch))
        
        return elements
    
    def _create_detailed_comparison(self, comparison: Dict, genome1: Dict, genome2: Dict) -> list:
        """Crea la comparación detallada"""
        elements = []
        
        elements.append(Paragraph("COMPARACIÓN DETALLADA", self.styles['CustomHeading']))
        elements.append(Spacer(1, 0.2*inch))
        
        # Gráfico de comparación
        categories = ['Longitud\n(normalizado)', 'GC Content\n(%)', 
                     'Genes CDS\n(normalizado)', 'Similitud\n(%)']
        
        # Normalizar valores para visualización
        max_length = max(genome1['length'], genome2['length'])
        max_genes = max(genome1['genes_analysis']['total_cds'], 
                       genome2['genes_analysis']['total_cds'])
        
        genome1_values = [
            (genome1['length'] / max_length) * 100,
            genome1['gc_content'],
            (genome1['genes_analysis']['total_cds'] / max_genes) * 100,
            comparison['similarity']['overall_similarity']
        ]
        
        genome2_values = [
            (genome2['length'] / max_length) * 100,
            genome2['gc_content'],
            (genome2['genes_analysis']['total_cds'] / max_genes) * 100,
            comparison['similarity']['overall_similarity']
        ]
        
        x = range(len(categories))
        width = 0.35
        
        fig, ax = plt.subplots(figsize=(8, 5))
        ax.bar([i - width/2 for i in x], genome1_values, width, 
               label=genome1['basic_info']['scientific_name'], color='#3949ab', alpha=0.7)
        ax.bar([i + width/2 for i in x], genome2_values, width, 
               label=genome2['basic_info']['scientific_name'], color='#f4511e', alpha=0.7)
        
        ax.set_ylabel('Valor')
        ax.set_title('Comparación de Genomas')
        ax.set_xticks(x)
        ax.set_xticklabels(categories)
        ax.legend()
        plt.tight_layout()
        
        img_buffer = BytesIO()
        plt.savefig(img_buffer, format='png', dpi=150)
        img_buffer.seek(0)
        plt.close()
        
        img = Image(img_buffer, width=6*inch, height=4*inch)
        elements.append(img)
        elements.append(Spacer(1, 0.3*inch))
        
        # Más métricas comparativas
        elements.append(Paragraph("Métricas Adicionales", self.styles['Section']))
        
        g1_codons = genome1['codons_analysis'].get('start_codon_usage', {}).get('total', 0)
        g2_codons = genome2['codons_analysis'].get('start_codon_usage', {}).get('total', 0)
        
        g1_introns = genome1['introns_exons'].get('total_introns', 0)
        g2_introns = genome2['introns_exons'].get('total_introns', 0)
        
        data_extra = [
            ['Métrica', genome1['basic_info']['scientific_name'], 
             genome2['basic_info']['scientific_name'], 'Diferencia'],
            ['Codones Inicio Funcionales', str(g1_codons), str(g2_codons), str(g1_codons - g2_codons)],
            ['Total Intrones', str(g1_introns), str(g2_introns), str(g1_introns - g2_introns)],
            ['Distancia Máx. entre Genes', f"{genome1['genes_analysis']['max_gene_distance']} pb", 
             f"{genome2['genes_analysis']['max_gene_distance']} pb", "-"],
            ['Densidad Genética (genes/Mbp)', 
             f"{genome1['genes_analysis']['total_cds'] / (genome1['length']/1000000):.2f}" if genome1['length'] > 0 else "0",
             f"{genome2['genes_analysis']['total_cds'] / (genome2['length']/1000000):.2f}" if genome2['length'] > 0 else "0", "-"]
        ]
        
        table_extra = Table(data_extra, colWidths=[2.2*inch, 1.4*inch, 1.4*inch, 1.5*inch])
        table_extra.setStyle(self._get_standard_table_style())
        elements.append(table_extra)
        
        return elements
    
    def _get_standard_table_style(self):
        """Retorna el estilo estándar para tablas"""
        return TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3949ab')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), 
             [colors.white, colors.HexColor('#f5f5f5')])
        ])
