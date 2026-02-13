"""
Script de prueba para verificar que el parser de interpretaciones funciona correctamente
"""

# Texto de ejemplo del usuario (el que está viendo en su navegador)
example_text = """¡Excelente! Como biólogo experto, me complace analizar estos genomas de *Escherichia coli*. Tenemos dos cepas muy conocidas, K-12 MG1655 y BL21(DE3), que a pesar de pertenecer a la misma especie, exhiben diferencias sutiles pero biológicamente significativas.

---

INTERPRETACIÓN CIENTÍFICA
El análisis comparativo de los genomas de *Escherichia coli* str. K-12 substr. MG1655 (NC_000913.3) y *Escherichia coli* BL21(DE3) (NC_012971.2) revela una profunda similitud genómica, como era de esperar para cepas de la misma especie, con una identidad global del 98.92%. Sin embargo, las diferencias observadas, aunque porcentualmente pequeñas, son altamente relevantes para comprender su biología, evolución y aplicaciones biotecnológicas.

---

INTERPRETACIÓN GENERAL
Imagina que los genomas son como el manual de instrucciones completo para construir y operar un organismo. En este caso, estamos viendo los manuales de dos tipos muy parecidos de la misma bacteria, *Escherichia coli*.
"""


# Crear una instancia temporal solo para usar el método _parse_interpretation
class TestParser:
    def __init__(self):
        pass
    
    def _parse_interpretation(self, text: str):
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
                # Si la línea es solo un marcador o separador, no la incluyas
                if stripped and stripped not in scientific_markers + general_markers and stripped != '---':
                    cleaned_lines.append(line)
            parts[key] = '\n'.join(cleaned_lines).strip()
        
        return parts

# Probar el parsing
parser = TestParser()
result = parser._parse_interpretation(example_text)

print("=" * 80)
print("RESULTADO DEL PARSING")
print("=" * 80)
print("\n✅ INTERPRETACIÓN CIENTÍFICA:")
print("-" * 80)
print(result.get('scientific', 'NO ENCONTRADA')[:500] + "...")
print("\n✅ INTERPRETACIÓN GENERAL:")
print("-" * 80)
print(result.get('general', 'NO ENCONTRADA')[:500] + "...")
print("\n" + "=" * 80)
print("VERIFICACIÓN:")
print(f"- Científica NO contiene 'INTERPRETACIÓN GENERAL': {('INTERPRETACIÓN GENERAL' not in result.get('scientific', ''))}")
print(f"- General NO contiene 'INTERPRETACIÓN CIENTÍFICA': {('INTERPRETACIÓN CIENTÍFICA' not in result.get('general', ''))}")
print(f"- Científica NO contiene '---': {('---' not in result.get('scientific', ''))}")
print(f"- General NO contiene '---': {('---' not in result.get('general', ''))}")
print("=" * 80)
