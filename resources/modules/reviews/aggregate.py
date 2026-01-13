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
# CONFIGURACIÓN MATEMÁTICA
# ==========================================
BASE_DIR = os.path.abspath(os.path.join(RESOURCES_DIR, '..'))
DATA_PATH = os.path.join(BASE_DIR, "src", "lib", "data")
INPUT_FILE = os.path.join(DATA_PATH, "reviews_processed.json")
OUTPUT_FILE = os.path.join(DATA_PATH, "professors_view.json")

# 1. Decaimiento Temporal (Vida Media: 1 Semestre)
HALF_LIFE_DAYS = 180  
DECAY_CONSTANT = math.log(2) / HALF_LIFE_DAYS

# 2. Amortiguador de Entropía (Anti-Review Bombing)
# Si un profesor recibe muchos votos en poco tiempo, bajamos su peso.
ENTROPY_WINDOW_HOURS = 2.0   # Ventana de análisis
ENTROPY_TRIGGER_COUNT = 8    # Umbral de votos sospechosos en esa ventana
ENTROPY_PENALTY_FACTOR = 0.25 # Los votos "spam" valen 25%

# 3. Abandono Silencioso (Threshold de Calidad)
MIN_EFFECTIVE_COUNT = 0.6 # Mínimo peso ponderado para mostrar stats

# Mapeo Legacy
LEGACY_MAPPING = {
    'ghost': 1, 'burocrata': 2, 'disponible': 3, 'mentor': 5
}

def calculate_weighted_tag_score(tag_weight_sum, total_weight_sum):
    if total_weight_sum == 0: return 0
    
    proportion = tag_weight_sum / total_weight_sum
    
    # Umbral más razonable (5%) y penalización suave en lugar de eliminar
    threshold = 0.1
    if proportion < threshold:
        # Reduce el score proporcionalmente en lugar de volverlo cero
        penalty = (proportion / threshold)
        return (proportion * math.log1p(total_weight_sum)) * penalty
        
    return proportion * math.log1p(total_weight_sum)

def parse_date(date_str):
    if not date_str: return None
    try:
        return datetime.datetime.fromisoformat(date_str.replace('Z', '+00:00')).replace(tzinfo=None)
    except:
        return None

def calculate_base_weight(review_date):
    """Calcula el peso natural por antigüedad."""
    if not review_date: return 0.0
    now = datetime.datetime.now()
    delta = (now - review_date).days
    if delta < 0: delta = 0
    return math.exp(-DECAY_CONSTANT * delta)

def check_bimodality(distribution):
    """
    Detecta si hay dos picos significativos separados por un valle.
    distribution: {1: count, 2: count, ..., 5: count}
    """
    counts = [distribution.get(i, 0) for i in range(1, 6)]
    peaks = []
    
    # Identificar picos locales
    for i in range(len(counts)):
        is_left_lower = (i == 0 or counts[i] > counts[i-1])
        is_right_lower = (i == len(counts)-1 or counts[i] > counts[i+1])
        
        if is_left_lower and is_right_lower and counts[i] > 0:
            peaks.append(i + 1) # Guardamos el score (1-5)

    # Es bimodal si hay al menos 2 picos y están separados por más de 1 punto
    # (Ej: picos en 1 y 5, o 2 y 4)
    if len(peaks) >= 2:
        distance = max(peaks) - min(peaks)
        if distance >= 2:
            return True
            
    return False

def apply_entropy_damper(reviews):
    """
    Detecta picos de densidad temporal (Review Bombing) y ajusta pesos.
    Retorna una lista de tuplas (review, factor_ajuste).
    """
    # Ordenar cronológicamente
    dated_reviews = []
    for r in reviews:
        d = parse_date(r.get('metadata', {}).get('serverTime') or r.get('metadata', {}).get('addedAt'))
        if d: dated_reviews.append({'data': r, 'date': d})
    
    dated_reviews.sort(key=lambda x: x['date'])
    
    adjustments = []
    
    # Ventana deslizante
    for i, current in enumerate(dated_reviews):
        window_start = current['date'] - datetime.timedelta(hours=ENTROPY_WINDOW_HOURS)
        
        # Contar cuántos votos hubo en la ventana previa [start, current]
        count_in_window = 0
        for j in range(i, -1, -1):
            prev = dated_reviews[j]
            if prev['date'] < window_start:
                break
            count_in_window += 1
            
        # Si la densidad supera el umbral, castigamos este voto
        if count_in_window > ENTROPY_TRIGGER_COUNT:
            adjustments.append((current['data'], ENTROPY_PENALTY_FACTOR))
        else:
            adjustments.append((current['data'], 1.0))
            
    # Mapear de vuelta para acceso rápido
    # (Usamos el fingerprint+fecha como pseudo-id o simplemente el índice si no cambia el orden)
    # Para seguridad, retornamos un mapa {fingerprint: factor} asumiendo dedup previa
    adjustment_map = {}
    for r, factor in adjustments:
        fp = r.get('metadata', {}).get('fingerprint')
        if fp: adjustment_map[fp] = factor
        
    return adjustment_map

def wilson_score_lower_bound(mean, count, stdev=0.0):
    if count == 0: return 0
    z = 1.96 
    sigma = stdev if count > 1 else 1.0 
    lower_bound = mean - (z * sigma / math.sqrt(count))
    return max(1.0, min(5.0, lower_bound))

def is_valid_comment(text):
    if not text or not isinstance(text, str): return False
    clean = text.strip()
    return len(clean) >= 4

def aggregate_professor_stats(prof_name, reviews):
    # ---------------------------------------------------------
    # FASE 1: DEDUPLICACIÓN (Latest Vote Wins)
    # ---------------------------------------------------------
    unique_reviews_map = {}
    
    # Ordenamos por fecha para que el último voto sobrescriba al anterior
    sorted_reviews = sorted(reviews, key=lambda x: x.get('metadata', {}).get('serverTime', ''), reverse=False)
    
    for rev in sorted_reviews:
        meta = rev.get('metadata', {})
        fp = meta.get('fingerprint')
        if not fp: fp = f"anon_{id(rev)}" # Fallback
        unique_reviews_map[fp] = rev
        
    active_reviews = list(unique_reviews_map.values())

    # ---------------------------------------------------------
    # FASE 2: ANÁLISIS DE ENTROPÍA (Anti-Raid)
    # ---------------------------------------------------------
    entropy_factors = apply_entropy_damper(active_reviews)

    # ---------------------------------------------------------
    # FASE 3: AGREGACIÓN MATEMÁTICA
    # ---------------------------------------------------------
    metrics_acc = {} 
    distributions = {}
    
    total_effective_weight = 0
    raw_count = len(active_reviews)
    last_review_date = ""
    tag_counts = {}

    tag_weighted_counts = {}

    for rev in active_reviews:
        meta = rev.get('metadata', {})
        fp = meta.get('fingerprint')
        date_str = meta.get('serverTime') or meta.get('addedAt')
        
        if not last_review_date or (date_str and date_str > last_review_date):
            last_review_date = date_str

        # Peso Base (Tiempo) * Factor Entropía (Anti-Spam)
        base_w = calculate_base_weight(parse_date(date_str))
        entropy_w = entropy_factors.get(fp, 1.0)

        final_weight = base_w * entropy_w
        total_effective_weight += final_weight
        
        stats = rev.get('stats', {})
        
        for key, val in stats.items():
            if val is None: continue
            
            val_float = None
            # Normalización de Tipos
            if isinstance(val, (int, float)):
                val_float = float(val)
            elif isinstance(val, str) and val.replace('.','',1).isdigit():
                val_float = float(val)
            elif isinstance(val, str) and val in LEGACY_MAPPING:
                val_float = float(LEGACY_MAPPING[val])
            
            if val_float is None: continue

            if key not in metrics_acc:
                metrics_acc[key] = {'w_sum': 0, 'total_w': 0, 'values': []}
                distributions[key] = {1:0, 2:0, 3:0, 4:0, 5:0}
            
            metrics_acc[key]['w_sum'] += val_float * final_weight
            metrics_acc[key]['total_w'] += final_weight
            metrics_acc[key]['values'].append((val_float, final_weight))
            
            # Distribución: Usamos conteo crudo para UI, o ponderado? 
            # Crudo es más transparente para "ver cuánta gente votó qué".
            bucket = max(1, min(5, round(val_float)))
            distributions[key][bucket] += 1

        tags = rev.get('activeTags', [])
        for tag in tags:
            # Ahora sumamos el PESO del voto, no un "1" plano.
            # Si el voto es antiguo o spam, aporta muy poco al tag.
            tag_weighted_counts[tag] = tag_weighted_counts.get(tag, 0.0) + final_weight
    
    processed_comments = []
    
    # Ordenar por fecha descendente
    reviews_for_comments = sorted(
        active_reviews, 
        key=lambda x: x.get('metadata', {}).get('serverTime', '') or '', 
        reverse=True
    )

    for rev in reviews_for_comments:
        raw_text = rev.get('rewritten_summary') or rev.get('summary') or rev.get('comment')
        
        if is_valid_comment(raw_text):
            meta = rev.get('metadata', {})
            processed_comments.append({
                "text": raw_text.strip(),
                "date": meta.get('serverTime') or meta.get('addedAt') or datetime.datetime.now().isoformat(),
                "tags": rev.get('activeTags', []) # Contexto útil
            })
            
        # Límite eficiente: Solo los 15 más recientes para no inflar el JSON
        if len(processed_comments) >= 15:
            break

    # Construcción de Stats Finales
    final_stats = {}
    
    # Abandono Silencioso: Si el peso efectivo es muy bajo, no mostramos stats detalladas
    is_insufficient_data = total_effective_weight < MIN_EFFECTIVE_COUNT

    for key, data in metrics_acc.items():
        w_total = data['total_w']
        
        if w_total > 0 and not is_insufficient_data:
            weighted_mean = data['w_sum'] / w_total
            
            # Desviación Estándar Ponderada
            variance_sum = sum([w * ((v - weighted_mean) ** 2) for v, w in data['values']])
            weighted_variance = variance_sum / w_total
            weighted_stdev = math.sqrt(weighted_variance)
            
            # Limite inferior de confianza
            confidence_lower = wilson_score_lower_bound(weighted_mean, raw_count, weighted_stdev)
            
            final_stats[key] = {
                'avg': round(weighted_mean, 2),
                'stdev': round(weighted_stdev, 2),
                'safe_score': round(confidence_lower, 2),
                'distribution': distributions[key],
                'is_bimodal': check_bimodality(distributions[key])
            }
        else:
            final_stats[key] = None
    
    tag_scores = []
    for tag, w_sum in tag_weighted_counts.items():
        score = calculate_weighted_tag_score(w_sum, total_effective_weight)
        tag_scores.append((tag, score))

    sorted_tags = sorted(tag_scores, key=lambda x: x[1], reverse=True)[:6]
    top_tags = [t[0] for t in sorted_tags]

    return {
        "id": prof_name,
        "name": prof_name, 
        "stats": final_stats,
        "tags": top_tags,
        "comments": processed_comments,
        "meta": {
            "reviewCount": raw_count,
            "effectiveCount": round(total_effective_weight, 1),
            "lastUpdated": last_review_date,
            "isArchived": is_insufficient_data
        }
    }

def main():
    print(f"⚙️ Iniciando agregación con Lógica Anti-Entropía...")
    
    if not os.path.exists(INPUT_FILE):
        print("❌ No se encontró el archivo de reseñas procesadas.")
        return

    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
            if not isinstance(raw_data, list): raw_data = []
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