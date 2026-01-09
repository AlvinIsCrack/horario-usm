import json
import os
import sys
import math
import datetime

# Ajuste de path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODULES_DIR = os.path.dirname(CURRENT_DIR) 
RESOURCES_DIR = os.path.dirname(MODULES_DIR)
sys.path.append(RESOURCES_DIR)

from modules import utils

# ==========================================
# CONFIGURACIÓN
# ==========================================
BASE_DIR = os.path.abspath(os.path.join(RESOURCES_DIR, '..'))
DATA_PATH = os.path.join(BASE_DIR, "src", "lib", "data")
INPUT_FILE = os.path.join(DATA_PATH, "reviews_processed.json")
OUTPUT_FILE = os.path.join(DATA_PATH, "professors_view.json")

# Configuración Matemática
HALF_LIFE_DAYS = 180  # 1 Semestre
DECAY_CONSTANT = math.log(2) / HALF_LIFE_DAYS

# MAPA DE COMPATIBILIDAD (LEGACY)
# Solo se usa si el valor que llega NO es un número.
LEGACY_MAPPING = {
    'ghost': 1,
    'burocrata': 2,
    'disponible': 3,  # Ajustado al nivel 3 de BARS
    'mentor': 5       # Ajustado al nivel 5 de BARS
}

def calculate_time_weight(date_str):
    if not date_str: return 0.0
    try:
        review_date = datetime.datetime.fromisoformat(date_str.replace('Z', '+00:00')).replace(tzinfo=None)
        now = datetime.datetime.now()
        delta = (now - review_date).days
        if delta < 0: delta = 0
        return math.exp(-DECAY_CONSTANT * delta)
    except Exception as e:
        return 0.0

def wilson_score_lower_bound(mean, count, stdev=0.0):
    if count == 0: return 0
    z = 1.96 
    sigma = stdev if count > 1 else 1.0 
    lower_bound = mean - (z * sigma / math.sqrt(count))
    return max(1.0, min(5.0, lower_bound))

def aggregate_professor_stats(prof_name, reviews):
    metrics_acc = {} 
    distributions = {}
    
    total_weight = 0
    raw_count = len(reviews)
    last_review_date = ""
    tag_counts = {}

    for rev in reviews:
        meta = rev.get('metadata', {})
        date_str = meta.get('serverTime') or meta.get('addedAt')
        
        if not last_review_date or (date_str and date_str > last_review_date):
            last_review_date = date_str

        weight = calculate_time_weight(date_str)
        total_weight += weight
        
        stats = rev.get('stats', {})
        
        for key, val in stats.items():
            if val is None: continue
            
            val_float = None
            
            # CASO 1: Dato Nuevo (Numérico) - Prioridad Absoluta
            if isinstance(val, (int, float)):
                val_float = float(val)
            elif isinstance(val, str) and val.replace('.','',1).isdigit():
                val_float = float(val)
            
            # CASO 2: Dato Legacy (Texto) - Fallback
            elif isinstance(val, str) and val in LEGACY_MAPPING:
                val_float = float(LEGACY_MAPPING[val])
            
            if val_float is None: continue

            # Inicialización de acumuladores
            if key not in metrics_acc:
                metrics_acc[key] = {'w_sum': 0, 'total_w': 0, 'values': []}
                distributions[key] = {1:0, 2:0, 3:0, 4:0, 5:0}
            
            metrics_acc[key]['w_sum'] += val_float * weight
            metrics_acc[key]['total_w'] += weight
            metrics_acc[key]['values'].append((val_float, weight))
            
            bucket = max(1, min(5, round(val_float)))
            distributions[key][bucket] += 1

        # Tags processing... (igual)
        tags = rev.get('activeTags', [])
        for tag in tags:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1

    final_stats = {}
    
    for key, data in metrics_acc.items():
        w_total = data['total_w']
        if w_total > 0:
            weighted_mean = data['w_sum'] / w_total
            variance_sum = sum([w * ((v - weighted_mean) ** 2) for v, w in data['values']])
            weighted_variance = variance_sum / w_total
            weighted_stdev = math.sqrt(weighted_variance)
            
            confidence_lower = wilson_score_lower_bound(weighted_mean, raw_count, weighted_stdev)
            
            final_stats[key] = {
                'avg': round(weighted_mean, 2),
                'stdev': round(weighted_stdev, 2),
                'safe_score': round(confidence_lower, 2),
                'distribution': distributions[key]
            }
        else:
            final_stats[key] = None

    sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    top_tags = [t[0] for t in sorted_tags]

    return {
        "id": prof_name,
        "name": prof_name, 
        "stats": final_stats,
        "tags": top_tags,
        "meta": {
            "reviewCount": raw_count,
            "effectiveCount": round(total_weight, 1),
            "lastUpdated": last_review_date
        }
    }

def main():
    print(f"⚙️ Iniciando agregación de reseñas...")
    
    if not os.path.exists(INPUT_FILE):
        print("❌ No se encontró el archivo de reseñas procesadas.")
        return

    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
    except Exception as e:
        print(f"❌ Error leyendo JSON: {e}")
        return

    professors_map = {}
    for entry in raw_data:
        p_name = entry.get('name')
        if not p_name: continue
        
        if p_name not in professors_map:
            professors_map[p_name] = []
        professors_map[p_name].append(entry)

    aggregated_view = {}
    for p_name, reviews in professors_map.items():
        aggregated_view[p_name] = aggregate_professor_stats(p_name, reviews)

    utils.atomic_write(OUTPUT_FILE, aggregated_view)
    print(f"✅ Agregación completada. Guardado en: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()