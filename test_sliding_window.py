"""
Script de prueba para verificar el análisis de sliding window
"""
from genome_analyzer import GenomeAnalyzer
import os
from dotenv import load_dotenv

load_dotenv()

email = os.getenv('NCBI_EMAIL')
print(f"Probando analisis de sliding window con email: {email}\n")

analyzer = GenomeAnalyzer(email=email)

# Probar con COVID-19 (pequeño, tiene secuencia completa)
print("="*70)
print("Analizando NC_045512.2 (SARS-CoV-2 / COVID-19)")
print("="*70)

try:
    result = analyzer.analyze_genome("NC_045512.2")
    
    print(f"\n[INFO BASICA]")
    print(f"  Organismo: {result['basic_info']['scientific_name']}")
    print(f"  Longitud: {result['length']:,} bp")
    print(f"  GC Content: {result['gc_content']}%")
    print(f"  Genes CDS: {result['genes_analysis']['total_cds']}")
    
    codons = result['codons_analysis']
    
    print(f"\n[ANALISIS DE SLIDING WINDOW - CODONES DE INICIO ATG]")
    print(f"  Total encontrados en secuencia: {codons['start_codons']['ATG']['total']}")
    print(f"  Dentro de CDS (Verdaderos): {codons['start_codons']['ATG']['true']}")
    print(f"  Fuera de CDS (Falsos positivos): {codons['start_codons']['ATG']['false']}")
    
    print(f"\n[ANALISIS DE SLIDING WINDOW - CODONES STOP]")
    print(f"  TAA - Total: {codons['stop_codons']['TAA']['total']}, En CDS: {codons['stop_codons']['TAA']['true']}, Fuera CDS: {codons['stop_codons']['TAA']['false']}")
    print(f"  TAG - Total: {codons['stop_codons']['TAG']['total']}, En CDS: {codons['stop_codons']['TAG']['true']}, Fuera CDS: {codons['stop_codons']['TAG']['false']}")
    print(f"  TGA - Total: {codons['stop_codons']['TGA']['total']}, En CDS: {codons['stop_codons']['TGA']['true']}, Fuera CDS: {codons['stop_codons']['TGA']['false']}")
    print(f"  TOTAL STOPS verdaderos (en CDS): {codons['stop_codons']['total_true_stops']}")
    print(f"  TOTAL STOPS falsos (fuera CDS): {codons['stop_codons']['total_false_stops']}")
    
    if 'potential_orfs' in codons:
        print(f"\n[ORFS POTENCIALES DETECTADOS]")
        print(f"  ORFs potenciales (>100bp): {codons['potential_orfs']}")
    
    print(f"\n[METODO USADO]: {codons.get('method', 'N/A')}")
    
    print("\n[OK] Analisis exitoso con sliding window real!")
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
