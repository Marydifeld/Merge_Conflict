import process from 'node:process';

const API_KEY = process.argv[2];
if (!API_KEY) {
  console.error("Usage: node test_gemini.js <YOUR_API_KEY>");
  process.exit(1);
}

const MODEL_NAME = "gemini-2.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:streamGenerateContent?key=${API_KEY}`;

const SYSTEM_INSTRUCTION = {
  parts: [{
    text: "Eres un analista experto en retención y ventas comerciales para tiendas de abasto en México. Tu objetivo es enriquecer e interpretar la probabilidad de abandono (churn) de un cliente a partir de un modelo de ML. Debes dar explicaciones de negocio conversacionales en español mexicano, relacionar tendencias de consumo, incorporar condiciones regionales/territoriales realistas y sugerir propuestas concretas para que el vendedor las use."
  }]
};

const GROUNDING_TOOL = {
  google_search: {}
};

const clientData = {
  cliente_id: 'Tienda_MX_9032',
  churn_score: 0.92,
  territorio: 'CDMX',
  subchannel: 'Tortillería',
  tamano: 'Mediano'
};

const prompt = `Analiza al cliente en riesgo de abandono.
ID: ${clientData.cliente_id}
Territorio: ${clientData.territorio}
Subcanal: ${clientData.subchannel}
Tamaño: ${clientData.tamano}
Churn Score: ${clientData.churn_score}
Devuelve el análisis estructurado en JSON.`;

async function runTest() {
  console.log("Testing Gemini API call with Google Search grounding tool only...");
  
  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [GROUNDING_TOOL],
    generationConfig: {
      thinkingConfig: {
        thinkingBudget: 2048
      }
    }
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log(`Response Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log("Response Body snippet:");
    console.log(text.substring(0, 1000));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

runTest();
