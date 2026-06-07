const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
const MODEL_NAME = "gemini-3.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:streamGenerateContent?key=${API_KEY}`;

import dashboardData from '../data/dashboard_data.json';


// System instruction to guide Gemini's persona and language tone
const SYSTEM_INSTRUCTION = {
  parts: [{
    text: "Eres un analista experto en retención y ventas comerciales para tiendas de abasto en México. Tu objetivo es enriquecer e interpretar la probabilidad de abandono (churn) de un cliente a partir de un modelo de ML. Debes dar explicaciones de negocio conversacionales en español mexicano que sean sumamente concisas, estructuradas y orientadas a la acción (máximo 3 párrafos o viñetas cortos en total). Relaciona tendencias y sugiere una propuesta concreta para el vendedor."
  }]
};


// [HACKATHON CAPABILITY: FUNCTION CALLING TOOL DECLARATION]
// Exposes the function to query monthly client trends when Gemini decides it needs history
const FUNCTION_TOOL = {
  functionDeclarations: [
    {
      name: "get_client_monthly_trend",
      description: "Returns the full monthly history array of transactions, volume sold, and churn scores for a specific customer store.",
      parameters: {
        type: "OBJECT",
        properties: {
          customer_id: {
            type: "STRING",
            description: "The unique encrypted identifier of the customer store."
          }
        },
        required: ["customer_id"]
      }
    }
  ]
};

// [HACKATHON CAPABILITY: GROUNDING TOOL DECLARATION]
// Enables Google Search grounding tool for real-world territorial context
const GROUNDING_TOOL = {
  google_search: {}
};

// [HACKATHON CAPABILITY: STRUCTURED OUTPUT SCHEMA]
// Enforces a strict JSON output matching the required dashboard shape
const STRUCTURED_OUTPUT_SCHEMA = {
  responseMimeType: "application/json",
  responseSchema: {
    type: "OBJECT",
    properties: {
      interpretacion: {
        type: "STRING",
        description: "Interpretación detallada de negocio de los factores de ML y la tendencia mensual."
      },
      contexto_territorio: {
        type: "STRING",
        description: "Análisis del entorno territorial, clima competitivo local y condiciones económicas basadas en grounding de Google Search."
      },
      urgencia: {
        type: "STRING",
        enum: ["Alta", "Media", "Baja"],
        description: "La prioridad de atención del cliente."
      },
      mensaje_para_vendedor: {
        type: "STRING",
        description: "Una frase concisa y concreta en español mexicano que el vendedor puede usar al visitar al tendero."
      }
    },
    required: ["interpretacion", "contexto_territorio", "urgencia", "mensaje_para_vendedor"]
  }
};

/**
 * Helper: Extracts details from failed API response bodies
 */
async function parseFetchError(response) {
  let errorInfo = `${response.status} ${response.statusText || 'Error'}`;
  try {
    const text = await response.text();
    console.error("Gemini API error raw response:", text);
    try {
      const errJson = JSON.parse(text);
      const dataObj = Array.isArray(errJson) ? errJson[0] : errJson;
      if (dataObj?.error && dataObj.error.message) {
        errorInfo = `${response.status}: ${dataObj.error.message}`;
      } else if (dataObj?.message) {
        errorInfo = `${response.status}: ${dataObj.message}`;
      }
    } catch (e) {
      if (text) {
        errorInfo = `${response.status}: ${text.substring(0, 150)}`;
      }
    }
  } catch (err) {
    console.error("Failed to read Gemini API error body:", err);
  }
  return errorInfo;
}

/**
 * Helper: Parses SSE stream chunks in JSON format using a brace-matching buffer
 */
async function* makeSseTextIterator(responseStream) {
  const reader = responseStream.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Clean up array wrappers if present at the start of REST stream
      let cleanBuffer = buffer.trim();
      if (cleanBuffer.startsWith('[')) {
        cleanBuffer = cleanBuffer.substring(1).trim();
      }
      if (cleanBuffer.startsWith(',')) {
        cleanBuffer = cleanBuffer.substring(1).trim();
      }

      let braceCount = 0;
      let startIndex = 0;
      let inString = false;
      let lastParsedIndex = 0;

      for (let i = 0; i < cleanBuffer.length; i++) {
        const char = cleanBuffer[i];
        if (char === '"' && cleanBuffer[i - 1] !== '\\') {
          inString = !inString;
        }
        if (!inString) {
          if (char === '{') {
            if (braceCount === 0) startIndex = i;
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              const objStr = cleanBuffer.substring(startIndex, i + 1);
              try {
                const chunkObj = JSON.parse(objStr);
                
                // Check if this is a function call request
                const functionCallPart = chunkObj?.candidates?.[0]?.content?.parts?.find(p => p.functionCall);
                if (functionCallPart) {
                  yield { type: 'function_call', data: functionCallPart };
                }

                // Retrieve generated text parts
                const text = chunkObj?.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
                if (text) {
                  yield { type: 'text', data: text };
                }
              } catch (e) {
                // Incomplete object, skip and wait for more data
              }
              lastParsedIndex = i + 1;
            }
          }
        }
      }
      if (lastParsedIndex > 0) {
        buffer = cleanBuffer.substring(lastParsedIndex);
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Exposes a helper to parse incomplete JSON strings progressively during streaming
 */
export function parsePartialJSON(jsonStr) {
  if (!jsonStr) return {};

  let clean = jsonStr.trim();
  
  // Strip markdown code block wrappers if present (e.g. ```json ... ```)
  if (clean.startsWith("```json")) {
    clean = clean.substring(7).trim();
  } else if (clean.startsWith("```")) {
    clean = clean.substring(3).trim();
  }
  if (clean.endsWith("```")) {
    clean = clean.substring(0, clean.length - 3).trim();
  }
  clean = clean.trim();
  
  // Try complete parsing first
  try {
    return JSON.parse(clean);
  } catch (e) {
    // Regex based recovery parser for progressive rendering
    const result = {};
    
    const interpretacionMatch = clean.match(/"interpretacion"\s*:\s*"((?:[^"\\]|\\.)*)/);
    if (interpretacionMatch) {
      result.interpretacion = unescapeStr(interpretacionMatch[1]);
    }
    const contextoMatch = clean.match(/"contexto_territorio"\s*:\s*"((?:[^"\\]|\\.)*)/);
    if (contextoMatch) {
      result.contexto_territorio = unescapeStr(contextoMatch[1]);
    }
    const urgenciaMatch = clean.match(/"urgencia"\s*:\s*"((?:[^"\\]|\\.)*)/);
    if (urgenciaMatch) {
      result.urgencia = unescapeStr(urgenciaMatch[1]);
    }
    const mensajeMatch = clean.match(/"mensaje_para_vendedor"\s*:\s*"((?:[^"\\]|\\.)*)/);
    if (mensajeMatch) {
      result.mensaje_para_vendedor = unescapeStr(mensajeMatch[1]);
    }
    return result;
  }
}

function unescapeStr(str) {
  try {
    return JSON.parse(`"${str}"`);
  } catch (e) {
    return str;
  }
}

/**
 * [HACKATHON CAPABILITY: STREAMING INITIAL ANALYSIS WITH THINKING, GROUNDING, AND FUNCTION CALLS]
 */
export async function generateClientAnalysis(clientData, monthlyHistory) {
  if (!API_KEY) {
    throw new Error("Missing VITE_GEMINI_API_KEY in environment variables.");
  }

  // Construct initial request contents, passing monthlyHistory directly to context
  const prompt = `Analiza al cliente en riesgo de abandono.
  Detalles del cliente:
  - ID de Cliente: ${clientData.cliente_id}
  - Territorio: ${clientData.territorio}
  - Subcanal: ${clientData.subchannel}
  - Tamaño de Tienda: ${clientData.tamano}
  - Score de Churn Actual: ${Math.round(clientData.churn_score * 100)}%

  ML razones de riesgo provistas por el modelo:
  "${clientData.razones || 'Sin razones especificadas'}"

  ML recomendaciones propuestas por el modelo:
  "${clientData.propuestas || 'Sin recomendaciones registradas'}"

  Historial mensual de transacciones y volumen vendido (en cajas):
  ${JSON.stringify(monthlyHistory || [])}

  Por favor, genera un análisis e interpretación sumamente concisa y directa al grano en español mexicano conversacional para nuestro equipo comercial.
  Estructura el análisis en máximo 3 párrafos o puntos breves:
  1. Interpreta qué significan las razones de riesgo del modelo ML y las tendencias mensuales del historial en la práctica.
  2. Identifica brevemente factores estacionales, condiciones de competencia o economía regional para "${clientData.territorio}" y el subcanal "${clientData.subchannel}".
  3. Determina la urgencia (Alta, Media o Baja) con una breve línea.
  4. Concluye con una propuesta concreta ("Frase Clave") corta en un bloque de cita para que el vendedor la use al visitar la tienda.

  Devuelve una respuesta corta y directa. Evita rodeos o repetir datos obvios. Usa formato markdown limpio.`;

  const contents = [
    {
      role: "user",
      parts: [{ text: prompt }]
    }
  ];

  // Request payload config - only uses grounding to avoid combining built-in tools and function calling
  const payload = {
    contents,
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [GROUNDING_TOOL],
    generationConfig: {
      thinkingConfig: {
        thinkingBudget: 2048
      }
    }
  };

  return new ReadableStream({
    async start(controller) {
      try {
        let response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorInfo = await parseFetchError(response);
          console.warn("Primary Gemini analysis with Grounding failed:", errorInfo);
          
          // Retry without the grounding tool (fallback for quota/regional limits)
          console.log("Retrying Gemini analysis request without Grounding tool...");
          const fallbackPayload = {
            ...payload,
            tools: undefined // Remove grounding tool
          };
          
          response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fallbackPayload)
          });
          
          if (!response.ok) {
            const fallbackErrorInfo = await parseFetchError(response);
            throw new Error(`Gemini API error (fallback): ${fallbackErrorInfo}`);
          }
        }

        const sseIterator = makeSseTextIterator(response.body);
        for await (const chunk of sseIterator) {
          if (chunk.type === 'text') {
            controller.enqueue(chunk.data);
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    }
  });
}

/**
 * [HACKATHON CAPABILITY: MULTI-TURN CHAT CONVERSATION]
 * Sends a follow-up user query while maintaining full context of the client profile and past history
 */
export async function sendFollowUp(message, conversationHistory, clientData) {
  if (!API_KEY) {
    throw new Error("Missing VITE_GEMINI_API_KEY in environment variables.");
  }

  // System context defining the customer's detail parameters
  const clientContext = `Conversación de seguimiento para el cliente con ID "${clientData.cliente_id}".
  Perfil del cliente:
  - Territorio: ${clientData.territorio}
  - Subcanal: ${clientData.subchannel}
  - Tamaño: ${clientData.tamano}
  - ML Churn Risk: ${Math.round(clientData.churn_score * 100)}%
  - Razones ML: ${clientData.razones}
  - Propuestas ML: ${clientData.propuestas}

  Responde de manera conversacional, profesional y concisa en español mexicano, siempre enfocándote en ayudar al equipo comercial a retener a esta tienda.`;

  // Format the history items for the contents list
  // Gemini REST API expects roles: "user" and "model"
  const historyContents = conversationHistory.map(turn => ({
    role: turn.sender === "user" ? "user" : "model",
    parts: [{ text: turn.text }]
  }));

  // Append new user message at the end
  const contents = [
    {
      role: "user",
      parts: [{ text: clientContext }]
    },
    ...historyContents,
    {
      role: "user",
      parts: [{ text: message }]
    }
  ];

  const payload = {
    contents,
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [FUNCTION_TOOL]
  };

  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorInfo = await parseFetchError(response);
          throw new Error(`Gemini API error: ${errorInfo}`);
        }

        const sseIterator = makeSseTextIterator(response.body);
        for await (const chunk of sseIterator) {
          if (chunk.type === 'text') {
            controller.enqueue(chunk.data);
          } else if (chunk.type === 'function_call') {
            // [HACKATHON CAPABILITY: FUNCTION CALLING INTERCEPTOR]
            // Logs request and injects a status indicator to the chat view
            console.log("Gemini API requested monthly history via function call part:", chunk.data);
            const call = chunk.data.functionCall;
            // controller.enqueue(`\n*Sistema: Gemini solicitó el historial de ventas mediante la función '${call.name}'...*\n\n`);
            
            // Retrieve history locally from dashboard_data.json
            const customerId = call.args?.customer_id || clientData.cliente_id;
            const historyKey = customerId.length > 12 ? customerId.substring(0, 12) + "..." : customerId;
            const history = dashboardData.historiales_top20_riesgo[historyKey] || [];
            
            // Send function response back to Gemini to get the final explanation
            const functionContents = [
              ...contents,
              {
                role: "model",
                // Pass the original part object (chunk.data) which includes the thoughtSignature and functionCall
                parts: [chunk.data]
              },
              {
                role: "function",
                parts: [{
                  functionResponse: {
                    name: call.name,
                    response: { output: history },
                    id: call.id
                  }
                }]
              }
            ];
            
            const nextPayload = {
              contents: functionContents,
              systemInstruction: SYSTEM_INSTRUCTION,
              tools: [FUNCTION_TOOL]
            };
            
            const nextResponse = await fetch(API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(nextPayload)
            });
            
            if (nextResponse.ok) {
              const nextIterator = makeSseTextIterator(nextResponse.body);
              for await (const nextChunk of nextIterator) {
                if (nextChunk.type === 'text') {
                  controller.enqueue(nextChunk.data);
                }
              }
            } else {
              const nextErrorInfo = await parseFetchError(nextResponse);
              controller.enqueue(`\n*Sistema: Error al resolver la llamada a función: ${nextErrorInfo}*`);
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    }
  });
}
