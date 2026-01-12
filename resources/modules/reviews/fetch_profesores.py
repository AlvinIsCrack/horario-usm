import requests
import json
import os
import sys
import datetime
import hashlib

# ==========================================
# IMPORTS
# ==========================================
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
SECRET_TOKEN = os.getenv("SECRET_TOKEN")
TYPES_PATH = os.path.join(BASE_DIR, "src/lib/logic/professors/types.ts")

if not SECRET_TOKEN:
    print("No se encontró la variable de entorno SECRET_TOKEN.")
    sys.exit(1)

# ==========================================
# UTILIDADES
# ==========================================
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

def generate_review_id(fingerprint, timestamp, prof_name):
    """Crea un hash único para evitar duplicados exactos."""
    raw = f"{fingerprint}|{timestamp}|{prof_name}"
    return hashlib.md5(raw.encode('utf-8')).hexdigest()

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
        response = requests.post(API_URL, json=payload, timeout=120) 
        response.raise_for_status()
        data = response.json()
        
        if data.get('status') == 'success':
            processed_count = data.get('processed_count', 0)
            
            if processed_count > 0:
                print(f"\n✨ Se recibieron {processed_count} reseñas analizadas.")
                
                raw_rows = data.get('raw_rows', [])
                gemini_results = data.get('gemini_result', [])
                analysis_map = {res.get('row_index'): res for res in gemini_results}
                
                existing_reviews = load_existing_reviews()
                existing_ids = set()
                for r in existing_reviews:
                    rid = r.get('id')
                    if not rid and 'metadata' in r:
                        rid = generate_review_id(
                            r['metadata'].get('fingerprint', ''),
                            r['metadata'].get('serverTime', ''),
                            r.get('name', '')
                        )
                    if rid: existing_ids.add(rid)

                new_profiles = []
                
                for i, row in enumerate(raw_rows):
                    if len(row) < 6:
                        print(f"    Fila incompleta detectada en índice {i}. Saltando.")
                        continue

                    analysis = analysis_map.get(i)
                    if not analysis: continue
                    
                    score = analysis.get('score', 0.0)
                    
                    if score >= 0.5:
                        try:
                            review_payload = json.loads(row[5])
                            metrics = review_payload.get('metrics', {})

                            fingerprint = row[2]
                            server_time = row[0]
                            prof_name = row[1]

                            unique_id = generate_review_id(fingerprint, server_time, prof_name)
                            
                            if unique_id in existing_ids:
                                print(f"    Saltando duplicado: {prof_name} (ID: {unique_id[:8]}...)")
                                continue
                            
                            # Construcción del perfil de la reseña
                            profile_entry = {
                                "id": unique_id,
                                "name": row[1],
                                "stats": { **metrics }, 
                                "activeTags": review_payload.get('tags', []),
                                "metadata": {
                                    "score": score,
                                    "reason": analysis.get('reason'),
                                    "addedAt": datetime.datetime.now().isoformat(),
                                    "serverTime": row[0],
                                    "fingerprint": row[2]
                                }
                            }

                            new_profiles.append(profile_entry)
                            existing_ids.add(unique_id)
                            print(f"   ✅ Guardada: {row[1]} (Score: {score})")
                        except Exception as e:
                            print(f"   ⚠️ Error parseando fila {i}: {e}")
                    else:
                        print(f"   🗑️ Descartada: Score bajo ({score}) - {analysis.get('reason')}")

                if new_profiles:
                    combined = existing_reviews + new_profiles
                    utils.atomic_write(OUTPUT_FILE, combined)
                    print(f"\n💾 {len(new_profiles)} nuevas reseñas escritas en {OUTPUT_FILE}")
                    has_changes = True
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