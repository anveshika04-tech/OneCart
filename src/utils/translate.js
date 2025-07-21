export async function translateHindiToEnglish(hindiText) {
 
  const hindiRegex = /[\u0900-\u097F]/;
  if (!hindiRegex.test(hindiText)) {
    
    return hindiText;
  }
  const TRANSLATE_URL = import.meta.env.VITE_TRANSLATE_URL || 'http://localhost:5002';
  const response = await fetch(`${TRANSLATE_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: hindiText })
  });
  if (!response.ok) throw new Error('Translation server error');
  const data = await response.json();
  return data.translation;
} 