"""
Script para listar modelos disponibles de Gemini
"""
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key (primeros 10 chars): {api_key[:10]}...\n")

genai.configure(api_key=api_key)

print("Listando modelos disponibles de Gemini:\n")
print("="*70)

try:
    for model in genai.list_models():
        if 'generateContent' in model.supported_generation_methods:
            print(f"Modelo: {model.name}")
            print(f"  Metodos soportados: {model.supported_generation_methods}")
            print(f"  Display name: {model.display_name}")
            print("-"*70)
except Exception as e:
    print(f"Error al listar modelos: {e}")
    import traceback
    traceback.print_exc()
