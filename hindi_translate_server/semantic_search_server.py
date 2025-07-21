from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
print("Torch version:", torch.__version__)
from sentence_transformers import SentenceTransformer
import numpy as np
import json
import os
import sys

app = Flask(__name__)
CORS(app)

# Load products
PRODUCTS_PATH = os.path.join(os.path.dirname(__file__), '..', 'products.json')
with open(PRODUCTS_PATH, 'r', encoding='utf-8') as f:
    products = json.load(f)

# Load model
model = SentenceTransformer('intfloat/e5-base-v2')
_ = model.encode(["warmup"], convert_to_numpy=True)  # Warmup call

def handle_exception(exc_type, exc_value, exc_traceback):
    print("Uncaught exception:", exc_value)
    import traceback; traceback.print_exception(exc_type, exc_value, exc_traceback)
sys.excepthook = handle_exception

# Nudge themes and templates
NUDGE_THEMES = [
    { 'theme': 'travel', 'keywords': ['travel', 'trip', 'flight', 'adventure', 'backpack'], 'nudge': "Looks like your group is planning a trip! Want to see travel combos?" },
    { 'theme': 'saree', 'keywords': ['saree', 'lehenga', 'dupatta', 'ethnic'], 'nudge': "You’ve added several sarees! Would you like to see matching accessories?" },
    { 'theme': 'accessory', 'keywords': ['bangles', 'jewelry', 'accessory', 'earring', 'necklace'], 'nudge': "Accessories complete the look! Want to see trending jewelry?" },
    { 'theme': 'electronics', 'keywords': ['electronics', 'gadget', 'tech', 'phone', 'laptop'], 'nudge': "Tech shopping spree! Want to see the latest deals on electronics?" },
    # Add more as needed
]

@app.route('/nudge_theme', methods=['POST'])
def nudge_theme():
    data = request.get_json(silent=True) or {}
    summary = data.get('summary', '').strip()
    if not summary:
        return jsonify({'theme': None, 'similarity': 0, 'nudge': None})
    theme_texts = [' '.join(t['keywords']) for t in NUDGE_THEMES]
    embeddings = model.encode([summary] + theme_texts, convert_to_numpy=True)
    summary_emb = embeddings[0]
    theme_embs = embeddings[1:]
    similarities = np.dot(theme_embs, summary_emb) / (np.linalg.norm(theme_embs, axis=1) * np.linalg.norm(summary_emb) + 1e-8)
    max_idx = int(np.argmax(similarities))
    best_theme = NUDGE_THEMES[max_idx]
    best_sim = float(similarities[max_idx])
    print(f"NudgeTheme: summary='{summary}' | best_theme='{best_theme['theme']}' | similarity={best_sim:.3f}")
    return jsonify({
        'theme': best_theme['theme'],
        'similarity': best_sim,
        'nudge': best_theme['nudge'] if best_sim >= 0.4 else None
    })

@app.route('/semantic_suggestions', methods=['POST'])
def semantic_suggestions():
    data = request.get_json(silent=True) or {}
    query = data.get("query", "")
    products_override = data.get("products")
    if not query.strip():
        return jsonify([])

   
    if products_override:
        print("Received override products. First 5 products:", [p.get("name", "N/A") for p in products_override[:5]])
    else:
        print("No override products received. Using default.")


    use_products = products_override if products_override else products

    product_texts = [
        f"passage: {p['name']} {p.get('category', '')} {p.get('description', '')} {' '.join(p.get('tags', []))}" for p in use_products
    ]
    product_embeddings = model.encode(product_texts, convert_to_numpy=True)

    query_embedding = model.encode([f"query: {query}"], convert_to_numpy=True)[0]
    similarities = np.dot(product_embeddings, query_embedding) / (
        np.linalg.norm(product_embeddings, axis=1) * np.linalg.norm(query_embedding) + 1e-8
    )

    # Boost similarity for tag matches
    query_lower = query.lower()
    for idx, p in enumerate(use_products):
        if any(tag.lower() in query_lower for tag in p.get('tags', [])):
            similarities[idx] += 0.2  # Boost score for tag match

    top_indices = similarities.argsort()[::-1]  # Sort all indices descending
    seen_names = set()
    deduped_results = []
    for i in top_indices:
        name = use_products[i].get('name', '')
        if name and name not in seen_names:
            deduped_results.append(use_products[i])
            seen_names.add(name)
        if len(deduped_results) == 5:
            break

    # Debug print with similarity scores
    print(f"Query: {query}")
    for i in top_indices[:10]:  # Print top 10 for debug
        print(f"Suggested: {use_products[i]['name']} | Score: {similarities[i]:.4f} | Tags: {use_products[i].get('tags', [])}")

    return jsonify(deduped_results)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5003))
    app.run(host="0.0.0.0", port=port, threaded=True)
    print("Flask server has stopped!")  