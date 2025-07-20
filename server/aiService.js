import axios from 'axios';
import fs from 'fs';
import path from 'path';

function loadProductsForGroup(groupType) {
  if (!groupType || groupType === 'Custom' || groupType === 'all') {
    console.log('*** Using universal products.json! ***');
    return JSON.parse(fs.readFileSync('C:/demo/products.json', 'utf-8'));
  }
  const filePath = path.resolve(process.cwd(), `products_${groupType}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'products_festive.json'), 'utf-8'));
}

function loadCombos() {
  const filePath = path.resolve(process.cwd(), 'combos.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

export function loadProductsForGroupExport(groupType) {
  return loadProductsForGroup(groupType);
}

export function loadCombosForGroup(groupType) {
  const filePath = path.resolve(process.cwd(), `combos_${groupType}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'combos.json'), 'utf-8'));
}

const combos = loadCombos();

function getRandomPhrase() {
  const phrases = [
    "This will suit you well!",
    "Perfect for your next outing!",
    "A great choice for any occasion!",
    "Pair it up for a stunning look!",
    "You'll love this combo!"
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

async function analyzeWithPythonService(message) {
  try {
    const response = await axios.post('http://localhost:5000/analyze', { message });
    const categories = response.data.categories;
    console.log('Python service categories:', categories);
    return categories;
  } catch (error) {
    console.error('Python service error:', error.message);
    return null;
  }
}


// export async function analyzeBundle(messagesArray) {
//   try {
//     const response = await axios.post('http://localhost:5001/bundle', { messages: messagesArray });
//     const bundle = response.data;
//     console.log('Mixtral bundle response:', bundle);
//     return bundle;
//   } catch (error) {
//     console.error('Mixtral bundle API error:', error.message);
//     return { context: null, suggestions: [] };
//   }
// }

function analyzeWithKeywords(message) {
  console.log('Using keyword-based analysis for:', message);
  const messageText = message.toLowerCase();
  const keywords = {
    saree: ['saree', 'traditional', 'ethnic'],
    kurta: ['kurta', 'ethnic', 'indian wear'],
    top: ['top', 'blouse', 'shirt', 't-shirt'],
    pants: ['pants', 'trousers', 'jeans', 'bottoms'],
    jewelry: ['jewelry', 'jhumka', 'earring', 'bangle', 'necklace'],
    dupatta: ['dupatta', 'scarf', 'stole'],
    shoes: ['shoes', 'sneakers', 'footwear']
  };
  const matchedCategories = Object.entries(keywords)
    .filter(([_, words]) => words.some(word => messageText.includes(word)))
    .map(([category]) => category);
  console.log('Keyword analysis results:', matchedCategories);
  return matchedCategories;
}

function getProductSuggestions(categories, count = 5, groupType = 'default') {
  const products = loadProductsForGroup(groupType);
  let suggestions = [];

  categories.forEach(cat => {
    const matches = products.filter(p => p.category === cat);
    if (matches.length > 0) {
      suggestions.push(matches[Math.floor(Math.random() * matches.length)]);
    }
  });
  
  if (suggestions.length < count) {
    const extra = products
      .filter(p => !suggestions.some(s => s.id === p.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, count - suggestions.length);
    suggestions = suggestions.concat(extra);
  }
  return { suggestions: suggestions.slice(0, count), combo: null, phrase: getRandomPhrase() };
}


export async function getSemanticSuggestions(query, count = 5, productsList) {
  try {
    console.log('Calling semantic server with query:', query);
    const response = await axios.post('http://localhost:5003/semantic_suggestions', { query, products: productsList });
    console.log('Semantic server response:', response.data);
  
    console.log('Semantic server suggested products:', response.data.map(p => p.name));
    
    return response.data.slice(0, count);
  } catch (error) {
    console.error('Semantic suggestion service error:', error.message);
    return [];
  }
}

function getComboSuggestions(query, count = 1, combosList = combos) {
  const lowerQuery = query.toLowerCase();
  const matched = combosList.filter(combo =>
    combo.tags.some(tag => lowerQuery.includes(tag)) ||
    combo.description.toLowerCase().includes(lowerQuery)
  );
  return matched.slice(0, count);
}

export async function analyzeMessage(message, count = 5, groupType = 'default') {
  const products = loadProductsForGroup(groupType);
  const combos = loadCombosForGroup(groupType);

 
  let filteredProducts = products;
  if (groupType && groupType !== 'default') {
    filteredProducts = products.filter(p =>
      p.tags && p.tags.map(t => t.toLowerCase()).includes(groupType.toLowerCase())
    );
    if (filteredProducts.length < count) filteredProducts = products;
  }
  
  let filteredCombos = combos;
  if (groupType && groupType !== 'default') {
    filteredCombos = combos.filter(combo =>
      combo.tags && combo.tags.map(t => t.toLowerCase()).includes(groupType.toLowerCase())
    );
    if (filteredCombos.length < 1) filteredCombos = combos;
  }

  
  const comboKeywords = ['combo', 'set', 'bundle', 'party set', 'deal'];
  const lowerMsg = message.toLowerCase();
  if (comboKeywords.some(kw => lowerMsg.includes(kw))) {
    const comboSuggestions = getComboSuggestions(message, 1, filteredCombos);
    if (comboSuggestions.length > 0) {
      const combo = comboSuggestions[0];
      const comboProducts = combo.products.map(pid => products.find(p => p.id === pid)).filter(Boolean);
      const phrase = `Super Saving Deal! 🎉 ${combo.name}: ${combo.description}`;
      return comboProducts.map((product, idx) => ({
        ...product,
        phrase: idx === 0 ? phrase : undefined
      }));
    }
  }

  
  const suggestions = await getSemanticSuggestions(message, count, filteredProducts);
  if (suggestions && suggestions.length > 0) {
    const phrase = "AI-powered suggestions just for you!";
    return suggestions.map((product, idx) => ({
      ...product,
      phrase: idx === 0 ? phrase : undefined
    }));
  }

  
  const comboSuggestions = getComboSuggestions(message, 1, filteredCombos);
  if (comboSuggestions.length > 0) {
    const combo = comboSuggestions[0];
    const comboProducts = combo.products.map(pid => products.find(p => p.id === pid)).filter(Boolean);
    const phrase = `Super Saving Deal! 🎉 ${combo.name}: ${combo.description}`;
    return comboProducts.map((product, idx) => ({
      ...product,
      phrase: idx === 0 ? phrase : undefined
    }));
  }

  
  return filteredProducts.slice(0, count);
}

export async function analyzeMessageNoCombo(message, count = 5, groupType = 'default') {
  const products = loadProductsForGroup(groupType);
  const combos = loadCombosForGroup(groupType);

  let filteredProducts = products;
  if (groupType && groupType !== 'default') {
    filteredProducts = products.filter(p =>
      p.tags && p.tags.map(t => t.toLowerCase()).includes(groupType.toLowerCase())
    );
    if (filteredProducts.length < count) filteredProducts = products;
  }
  const suggestions = await analyzeMessage(message, count, groupType);
  const phrase = "AI-powered suggestions just for you!";
  return suggestions.map((product, idx) => ({
    ...product,
    phrase: idx === 0 ? phrase : undefined
  }));
}