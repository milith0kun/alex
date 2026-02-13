"""
Script de prueba para verificar que genome_analyzer funciona correctamente
"""
from genome_analyzer import GenomeAnalyzer
import os
from dotenv import load_dotenv

load_dotenv()

email = os.getenv('NCBI_EMAIL')
print(f"Probando con email: {email}")

analyzer = GenomeAnalyzer(email=email)

# Probar con E. coli
print("\n=== Probando NC_000913.3 (E. coli) ===")
try:
    result = analyzer.analyze_genome("NC_000913.3")
    print(f"[OK] Analisis exitoso!")
    print(f"  - Longitud: {result['length']:,} bp")
    print(f"  - GC Content: {result['gc_content']}%")
    print(f"  - Genes CDS: {result['genes_analysis']['total_cds']}")
except Exception as e:
    print(f"[ERROR] {e}")

print("\n=== Probando NC_045512.2 (COVID-19) ===")
try:
    result = analyzer.analyze_genome("NC_045512.2")
    print(f"✓ Análisis exitoso!")
    print(f"  - Longitud: {result['length']:,} bp")
    print(f"  - GC Content: {result['gc_content']}%")
    print(f"  - Genes CDS: {result['genes_analysis']['total_cds']}")
except Exception as e:
    print(f"✗ Error: {e}")
