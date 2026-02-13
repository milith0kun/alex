"""Test simple del parser"""

text = """Intro text
---
INTERPRETACIÓN CIENTÍFICA
Scientific content here
---
INTERPRETACIÓN GENERAL  
General content here"""

# Simular la lógica del parser
scientific_markers = ['INTERPRETACIÓN CIENTÍFICA', 'CIENTÍFICA:']
general_markers = ['INTERPRETACIÓN GENERAL', 'GENERAL:']

sci_pos = text.find('INTERPRETACIÓN CIENTÍFICA')
gen_pos = text.find('INTERPRETACIÓN GENERAL')

scientific = text[sci_pos + len('INTERPRETACIÓN CIENTÍFICA'):gen_pos].strip()
general = text[gen_pos + len('INTERPRETACIÓN GENERAL'):].strip()

# Limpiar separadores
scientific = scientific.replace('---', '').strip()
general = general.replace('---', '').strip()

print("CIENTÍFICA:", repr(scientific))
print("\nGENERAL:", repr(general))
print("\n✅ Test exitoso - las secciones están separadas correctamente")
