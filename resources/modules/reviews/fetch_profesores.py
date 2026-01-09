LAST_PROCESSED_ROW = 0
import requests
import json
import os
import sys
import datetime

# Ajuste de Imports
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODULES_DIR = os.path.dirname(CURRENT_DIR) 
RESOURCES_DIR = os.path.dirname(MODULES_DIR)
sys.path.append(RESOURCES_DIR)

from modules import utils
try:
    from modules.reviews import aggregate
except ImportError:
    import aggregate

# ==========================================
# CONFIGURACIÓN
# ==========================================
BASE_DIR = os.path.abspath(os.path.join(CURRENT_DIR, '..', '..', '..'))
DATA_PATH = os.path.join(BASE_DIR, "src", "lib", "data")
OUTPUT_FILE = os.path.join(DATA_PATH, "reviews_processed.json")

os.makedirs(DATA_PATH, exist_ok=True)

API_URL = "https://script.google.com/macros/s/AKfycbwt3x_JzbcCvB1yUp77nJ-NuZHV08GBeVYazsQkrN_so90q5PLCYH1mQ1Gj8x7kdFJf/exec"
SECRET_TOKEN = "Rf98AsW2fzPTGbiW5juf3QDA0MUMhU4A59KdR4b18DwYYR5ZE9lLzKfVQOh9Zwwd"
TYPES_PATH = os.path.join(BASE_DIR, "src/lib/logic/professors/types.ts")

def update_script_state(new_index):
    try:
        file_path = os.path.abspath(__file__)
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        lines[0] = f"LAST_PROCESSED_ROW = {new_index}\n"
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        print(f"💾 Estado actualizado: LAST_PROCESSED_ROW = {new_index}")
    except Exception as e:
        print(f"❌ Error al guardar estado del script: {e}")

def get_types_context():
    try:
        if os.path.exists(TYPES_PATH):
            with open(TYPES_PATH, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = [line for line in content.splitlines() if not line.strip().startswith('//')]
                return "\n".join(lines)
    except Exception as e:
        print(f"⚠️ No se pudo leer types.ts: {e}")
    return ""

def load_existing_reviews():
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                content = json.load(f)
                # Validación crítica de estructura
                if isinstance(content, list):
                    return content
                else:
                    print(f"⚠️ Formato corrupto en historial. Se iniciará una nueva lista.")
                    return []
        except: return []
    return []

def trigger_gas_analysis():
    print(f"📡 Leyendo contexto desde {TYPES_PATH}...")
    types_context = get_types_context()
    
    print(f"🚀 Conectando a Google Apps Script (Modo Admin)...")
    
    payload = {
        'token': SECRET_TOKEN,
        'action': 'batch_analyze',
        'types_context': types_context
    }
    
    has_changes = False

    try:
        response = requests.post(API_URL, json=payload)
        response.raise_for_status()
        data = response.json()
        
        if data.get('status') == 'success':
            processed_count = data.get('processed_count', 0)
            
            if processed_count > 0:
                print(f"\n✨ Se recibieron {processed_count} reseñas analizadas.")
                
                raw_rows = data.get('raw_rows', [])
                gemini_results = data.get('gemini_result', [])
                analysis_map = {res.get('row_index'): res for res in gemini_results}
                
                new_profiles = []
                
                for i, row in enumerate(raw_rows):
                    analysis = analysis_map.get(i)
                    if not analysis: continue
                    
                    score = analysis.get('score', 0.0)
                    
                    if score >= 0.5:
                        try:
                            review_payload = json.loads(row[5])
                            metrics = review_payload.get('metrics', {})
                            
                            # Construcción del perfil de la reseña
                            profile_entry = {
                                "name": row[1],
                                "stats": { **metrics }, 
                                "activeTags": review_payload.get('tags', []),
                                "summary": review_payload.get('comment', ''),
                                "metadata": {
                                    "score": score,
                                    "reason": analysis.get('reason'),
                                    "addedAt": datetime.datetime.now().isoformat(),
                                    "serverTime": row[0],
                                    "fingerprint": row[2] # Guardamos fingerprint crudo para aggregate.py
                                }
                            }
                            new_profiles.append(profile_entry)
                            print(f"   ✅ Guardada: {row[1]} (Score: {score})")
                        except Exception as e:
                            print(f"   ⚠️ Error parseando fila {i}: {e}")
                    else:
                        print(f"   🗑️ Descartada: Score bajo ({score}) - {analysis.get('reason')}")

                if new_profiles:
                    existing = load_existing_reviews()
                    combined = existing + new_profiles
                    utils.atomic_write(OUTPUT_FILE, combined)
                    print(f"\n💾 {len(new_profiles)} nuevas reseñas escritas en {OUTPUT_FILE}")
                    has_changes = True
                
                new_last_row = data.get('new_last_row')
                if new_last_row:
                    update_script_state(new_last_row)

            else:
                print(f"\n💤 Todo al día. No hay reseñas nuevas.")
        else:
            print(f"\n❌ Error en servidor: {data.get('message')}")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
    except json.JSONDecodeError:
        print("❌ Error: Respuesta inválida.")

    # Ejecutar pipeline de agregación si hubo cambios
    if has_changes:
        print("\n🔄 Ejecutando re-agregación de estadísticas...")
        aggregate.main()

if __name__ == "__main__":
    trigger_gas_analysis()