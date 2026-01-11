# resources/modules/reviews/ai_worker.py

import os
import json
import time
import hashlib
import google.generativeai as genai
from typing import List, Dict, Any

# Configuración
AI_MODEL_NAME = "gemini-2.5-flash" 
MAX_REVIEWS_CONTEXT = 40
RATE_LIMIT_SLEEP = 2 

def get_reviews_hash(reviews: List[Dict]) -> str:
    """
    Genera un hash único basado en el contenido de las reseñas.
    Sirve para detectar si hubo cambios y evitar gastar tokens innecesariamente.
    """
    # Ordenamos para determinismo
    sorted_reviews = sorted(reviews, key=lambda x: x.get('timestamp', '') + x.get('comentario', '')[:10])
    
    content_str = ""
    for r in sorted_reviews:
        # Concatenamos ID (si existe), fecha y un trozo del comentario
        content_str += f"{r.get('id', '')}|{r.get('timestamp', '')}|{r.get('comentario', '')}|"
    
    return hashlib.sha256(content_str.encode('utf-8')).hexdigest()

def sample_reviews(reviews: List[Dict]) -> List[Dict]:
    """
    Selecciona un subconjunto representativo de reseñas si hay demasiadas.
    Prioridad: Recientes > Largas/Útiles > Extremas (para contraste).
    """
    if len(reviews) <= MAX_REVIEWS_CONTEXT:
        return reviews

    # 1. Separar las que tienen texto real
    text_reviews = [r for r in reviews if r.get('comentario') and len(r['comentario']) > 10]
    
    # Si hay pocas con texto, rellenamos con las más recientes aunque no tengan texto (por las métricas)
    if len(text_reviews) < 10:
        return sorted(reviews, key=lambda x: x.get('timestamp', ''), reverse=True)[:MAX_REVIEWS_CONTEXT]

    # 2. Estrategia de Sampling
    # Ordenar por fecha desc
    sorted_by_date = sorted(text_reviews, key=lambda x: x.get('timestamp', ''), reverse=True)
    
    selection = []
    # A. Las 15 más recientes (para captar cambios de metodología)
    selection.extend(sorted_by_date[:15])
    
    # B. Las restantes, ordenadas por longitud (asumiendo que más texto = más detalle)
    remaining = sorted_by_date[15:]
    remaining_by_len = sorted(remaining, key=lambda x: len(x.get('comentario', '')), reverse=True)
    
    selection.extend(remaining_by_len[:MAX_REVIEWS_CONTEXT - 15])
    
    return selection

def analyze_professor(model, prof_name: str, reviews: List[Dict], available_tags: List[str]) -> Dict:
    """
    Llama a la API de Gemini para generar el perfil.
    """
    sampled_reviews = sample_reviews(reviews)
    
    # Preparamos el texto para el prompt
    reviews_text = ""
    for r in sampled_reviews:
        # Formateamos métricas clave si existen
        metrics = r.get('metrics', {}) # Asumiendo estructura interna
        tags = r.get('tags', [])
        reviews_text += f"- ({r.get('timestamp', 'N/A')}) Nota: {r.get('score', 'N/A')}. Tags: {tags}. Comentario: {r.get('comentario', 'Sin texto')}\n"

    prompt = f"""
    Actúa como un analista académico objetivo para estudiantes de ingeniería.
    Analiza las siguientes reseñas sobre el profesor "{prof_name}".
    
    TUS OBJETIVOS:
    1. Generar un resumen ejecutivo imparcial (máx 200 chars).
    2. Identificar Pros y Contras claros.
    3. Asignar etiquetas (tags) de la lista permitida.
    4. Detectar banderas rojas (conductas graves).

    LISTA DE TAGS PERMITIDOS: {available_tags}

    RESEÑAS (Muestra representativa):
    {reviews_text}

    FORMATO JSON ESTRICTO (No Markdown, solo JSON):
    {{
        "summary": "Texto del resumen...",
        "pros": ["Pro 1", "Pro 2"],
        "cons": ["Contra 1", "Contra 2"],
        "tags_suggested": ["Tag1", "Tag2"],
        "red_flags": false
    }}
    """

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Limpieza de bloques de código si Gemini se pone creativo
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text.rsplit("\n", 1)[0]
        
        return json.loads(text)
    except Exception as e:
        print(f"    [!] Error procesando AI para {prof_name}: {e}")
        return {}

def process_summaries(professors_file: str, reviews_file: str):
    """
    Función principal orquestadora.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print(" [AI] ⚠️ GEMINI_API_KEY no encontrada. Saltando generación de resúmenes.")
        return

    print(" [AI] 🧠 Iniciando módulo de resúmenes con IA...")
    
    # Configurar Gemini
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        AI_MODEL_NAME,
        generation_config={"response_mime_type": "application/json"}
    )

    # Cargar datos
    try:
        with open(professors_file, 'r', encoding='utf-8') as f:
            professors_view = json.load(f)
        
        with open(reviews_file, 'r', encoding='utf-8') as f:
            reviews_data = json.load(f) # Asumiendo dict { "Nombre Profe": [Reviews...] }
    except FileNotFoundError:
        print(" [AI] ❌ Archivos de datos no encontrados.")
        return

    # Lista de tags permitidos (Extraer de las reseñas existentes o hardcodear)
    # Por simplicidad, extraemos tags únicos del dataset de reseñas actual
    all_tags = set()
    for prof_reviews in reviews_data.values():
        for r in prof_reviews:
            if 'tags' in r and isinstance(r['tags'], list):
                all_tags.update(r['tags'])
    available_tags_list = list(all_tags)

    updated_count = 0
    skipped_count = 0

    # Iterar sobre profesores en la vista final
    for prof in professors_view:
        name = prof.get('name')
        
        # Buscar reseñas crudas para este profesor
        # Nota: La key en reviews_data debe coincidir con el nombre. 
        # Si usas IDs, ajusta aquí.
        prof_reviews = reviews_data.get(name, [])

        if not prof_reviews:
            continue

        current_hash = get_reviews_hash(prof_reviews)
        
        # Verificar si necesitamos actualizar
        existing_ai = prof.get('ai_analysis', {})
        last_hash = existing_ai.get('last_analysis_hash')

        if last_hash == current_hash and existing_ai.get('summary'):
            skipped_count += 1
            continue # Datos no han cambiado, saltar

        print(f"    -> Analizando: {name} ({len(prof_reviews)} reseñas)")
        
        # Generar análisis
        analysis = analyze_professor(model, name, prof_reviews, available_tags_list)
        
        if analysis:
            # Inyectar metadatos técnicos
            analysis['last_analysis_hash'] = current_hash
            analysis['last_analysis_date'] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            analysis['review_count_at_analysis'] = len(prof_reviews)
            
            # Guardar en el objeto del profesor
            prof['ai_analysis'] = analysis
            updated_count += 1
            
            # Rate Limiting
            time.sleep(RATE_LIMIT_SLEEP)

    # Guardar cambios solo si hubo actualizaciones
    if updated_count > 0:
        with open(professors_file, 'w', encoding='utf-8') as f:
            json.dump(professors_view, f, indent=4, ensure_ascii=False)
        print(f" [AI] ✅ Proceso completado. Actualizados: {updated_count}. Saltados: {skipped_count}.")
    else:
        print(f" [AI] 💤 Todo actualizado. No se detectaron cambios en reseñas.")