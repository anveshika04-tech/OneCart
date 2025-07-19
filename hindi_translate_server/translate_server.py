from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from transformers.pipelines import pipeline

app = Flask(__name__)
CORS(app)

model_name = "Helsinki-NLP/opus-mt-hi-en"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

translator = pipeline(
    task="translation",
    model=model,
    tokenizer=tokenizer,
    src_lang="hi",
    tgt_lang="en"
)

@app.route('/translate', methods=['POST'])
def translate():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    if not text.strip():
        return jsonify({"translation": ""})
    try:
        result = translator(text)
        translation = result[0]['translation_text']
        return jsonify({"translation": translation})
    except Exception as e:
        print("Translation error:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5002) 
    #python --version
    #.\venv311\Scripts\activate