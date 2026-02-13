"""
Script para verificar los datos de codones contra GenBank
"""
from genome_analyzer import GenomeAnalyzer

def main():
    # Inicializar analizador
    analyzer = GenomeAnalyzer(email="test@example.com")
    
    # Analizar genoma NC_000913.3 (E. coli K-12)
    print("Analizando NC_000913.3 (E. coli K-12)...")
    result = analyzer.analyze_genome("NC_000913.3")
    
    print("\n=== INFORMACIÓN BÁSICA ===")
    print(f"Nombre: {result['basic_info']['organism']}")
    print(f"Longitud: {result['basic_info']['length']:,} bp")
    
    print("\n=== GENES ===")
    genes = result['genes']
    print(f"Total genes CDS: {genes['total_cds']}")
    print(f"Genes en hebra +: {genes['distribution']['plus']}")
    print(f"Genes en hebra -: {genes['distribution']['minus']}")
    
    print("\n=== CODONES ===")
    codons = result['codons_analysis']
    start = codons['start_codons']['ATG']
    stop = codons['stop_codons']
    
    print("\n🔬 CODONES FUNCIONALES (1 por gen):")
    print(f"  START funcionales: {start.get('functional', 'N/A')}")
    print(f"  STOP funcionales: {stop.get('total_functional_stops', 'N/A')}")
    print(f"    - TAA: {stop['TAA'].get('functional', 'N/A')}")
    print(f"    - TAG: {stop['TAG'].get('functional', 'N/A')}")
    print(f"    - TGA: {stop['TGA'].get('functional', 'N/A')}")
    
    print("\n🔍 SLIDING WINDOW (todas las ocurrencias):")
    print(f"  ATG total: {start['total']}")
    print(f"    - En CDS: {start['true']}")
    print(f"    - Fuera CDS: {start['false']}")
    print(f"  STOP total: {stop['TAA']['total'] + stop['TAG']['total'] + stop['TGA']['total']}")
    print(f"    - En CDS: {stop['total_true_stops']}")
    print(f"    - Fuera CDS: {stop['total_false_stops']}")
    
    print("\n✅ VERIFICACIÓN:")
    functional_start = start.get('functional', 0)
    functional_stop = stop.get('total_functional_stops', 0)
    total_cds = genes['total_cds']
    
    print(f"  ¿START funcionales ≈ Total CDS? {functional_start} ≈ {total_cds}: {'✓' if abs(functional_start - total_cds) < 100 else '✗'}")
    print(f"  ¿STOP funcionales ≈ Total CDS? {functional_stop} ≈ {total_cds}: {'✓' if abs(functional_stop - total_cds) < 100 else '✗'}")
    print(f"  ¿START ≈ STOP? {functional_start} ≈ {functional_stop}: {'✓' if abs(functional_start - functional_stop) < 100 else '✗'}")

if __name__ == "__main__":
    main()
