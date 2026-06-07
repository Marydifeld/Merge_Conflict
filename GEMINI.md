# ChurnGuard: Gemini API Implementation Guide

This guide details how ChurnGuard leverages Google's Gemini API to turn predictive machine learning indicators into context-aware, conversational retention strategies for commercial teams.

---

## Section 1 — Overview

Gemini acts as the "Intelligent Interpreter" between ChurnGuard's raw machine learning predictions and the human sales representative. While the ML model identifies that a store is at risk and lists indicators (like sales drops or cooler losses), Gemini synthesizes this data, grounds it with real-time local conditions, and generates a conversational, highly contextual action plan. This solves the "last-mile" problem of ML dashboards, giving sales reps visiting a store a concrete, personalized negotiation script rather than just charts and risk numbers.

---

## Section 2 — Capability Scorecard

| Capability | Status | File | Lines | What it does in this project |
| :--- | :--- | :--- | :--- | :--- |
| **Structured Output** | ✅ | `geminiClient.js` | [L45-L70](file:///c:/Users/Aylin/Churn/Merge_Conflict/frontend/src/utils/geminiClient.js#L45-L70) | Declares a strict JSON output schema to ensure the model returns structured fields for business interpretation, local territory context, urgency, and a customized seller quote. |
| **Streaming** | ✅ | `geminiClient.js` | [L280-L324](file:///c:/Users/Aylin/Churn/Merge_Conflict/frontend/src/utils/geminiClient.js#L280-L324), [L373-L453](file:///c:/Users/Aylin/Churn/Merge_Conflict/frontend/src/utils/geminiClient.js#L373-L453) | Streams text chunks progressively to the UI via a custom Server-Sent Events (SSE) parser, providing a responsive experience for the user during live analysis. |
| **Multi-turn Chat** | ✅ | `geminiClient.js` | [L330-L454](file:///c:/Users/Aylin/Churn/Merge_Conflict/frontend/src/utils/geminiClient.js#L330-L454) | Maintains user query histories and client context, allowing the commercial team to ask follow-up questions about local competition, retentions, or discount policies. |
| **Grounding with Google Search** | ✅ | `geminiClient.js` | [L39-L41](file:///c:/Users/Aylin/Churn/Merge_Conflict/frontend/src/utils/geminiClient.js#L39-L41), [L272](file:///c:/Users/Aylin/Churn/Merge_Conflict/frontend/src/utils/geminiClient.js#L272) | Uses Google Search grounding to discover real-time economic indicators, competitive updates, or climatic context in the client's specific territory. |
| **Thinking** | ✅ | `geminiClient.js` | [L273-L277](file:///c:/Users/Aylin/Churn/Merge_Conflict/frontend/src/utils/geminiClient.js#L273-L277) | Allocates a reasoning budget of 2048 tokens on the flash model to analyze the client's monthly sales trend history deeply before producing the initial assessment. |
| **Function Calling** | ✅ | `geminiClient.js` | [L18-L35](file:///c:/Users/Aylin/Churn/Merge_Conflict/frontend/src/utils/geminiClient.js#L18-L35), [L391-L447](file:///c:/Users/Aylin/Churn/Merge_Conflict/frontend/src/utils/geminiClient.js#L391-L447) | Declares the `get_client_monthly_trend` tool, enabling Gemini to request and digest the store's monthly transaction and boxes history dynamically when asked in chat. |

---

## Section 3 — Model Configuration

- **Model Name:** `gemini-3.5-flash`
- **Why this model was chosen over alternatives:** During early stages of development, heavier reasoning models were tested. However, we encountered rate limits and 404/503 HTTP errors due to regional quota limitations or tool-compatibility restrictions (like combining grounding and structured output in specific SDK endpoints). `gemini-3.5-flash` was selected because it natively supports the thinking budget parameter, offers low-latency streaming, and is highly robust and compatible with Google Search grounding.
- **Grounding Fallback Strategy:** If a grounding query fails due to quota limits, rate limits, or network restrictions, the `ReadableStream` interceptor catches the failure, logs a warning, and immediately retries the request without the `google_search` tool. This guarantees the application remains fully functional at all times.

---

## Section 4 — How the Integration Works

1. **User opens a client detail page:** The React UI retrieves the store's profile from MongoDB along with its historical months.
2. **User clicks "Generar Análisis Inteligente":** This invokes `generateClientAnalysis`, passing client profile data and the historical array.
3. **API call in `geminiClient.js`:** The client compiles a prompt containing the store attributes and history, initiates a POST request to the Gemini API, enabling Google Search grounding and setting a thinking budget of 2048 tokens.
4. **Streaming to the UI:** The response is processed chunk-by-chunk by `makeSseTextIterator`. The text tokens are enqueued into a React-friendly `ReadableStream` and displayed progressively in the UI.
5. **Function Calling Interceptor:** In the chat panel, if the user asks for historical sales details, Gemini detects the need for data and requests `get_client_monthly_trend`. The client interceptor catches this request, extracts the data locally from the JSON database, and resubmits it as a `functionResponse` to continue the chat.
6. **Multi-turn Chat Context:** The `sendFollowUp` method wraps all conversation histories inside role arrays (`"user"` and `"model"`), prepending a client context string to ensure that the model remains aware of which store is being discussed.

---

## Section 5 — The Two Exposed Functions

### 1. `generateClientAnalysis(clientData, monthlyHistory)`
- **Parameters:**
  - `clientData` (Object): Demographic parameters, ML risk reasons, and model recommendations.
  - `monthlyHistory` (Array): Historical list containing monthly sales and transaction counts.
- **Data Sent to Gemini:** Full client metrics, parsed ML reason text, and monthly history.
- **Returns:** A `ReadableStream` of streaming text chunks.
- **Prompt Structure Example (Summarized):**
  > *"Analiza al cliente en riesgo de abandono. ID: [ID], Territorio: [Territorio], Historial: [Historial]. Genera un análisis estructurado en español mexicano con la interpretación de riesgo, factores locales, urgencia y frase clave."*

### 2. `sendFollowUp(message, conversationHistory, clientData)`
- **Parameters:**
  - `message` (String): The follow-up query entered by the user in chat.
  - `conversationHistory` (Array): Past messages between the user and the assistant.
  - `clientData` (Object): Core client profile parameters.
- **Data Sent to Gemini:** Complete conversation history, current user query, and the client profile context block.
- **Returns:** A `ReadableStream` of streaming text chunks.
- **Prompt Structure Example (Summarized):**
  > *"Conversación de seguimiento para el cliente con ID [ID] en territorio [Territorio]. Responde conversacionalmente en español mexicano enfocado en retención."*

---

## Section 6 — Structured Output Schema

We declare the structured output schema as follows:

```javascript
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
```

### Business Interpretation of Fields:
- **`interpretacion`:** Translates cold model statistics into a narrative explanation of what is causing the risk, making it clear for a non-technical manager.
- **`contexto_territorio`:** Displays localized insights (competitors, economic shifts, or weather features) retrieved using Google Search Grounding to describe conditions in that specific city or region.
- **`urgencia`:** Classifies priority ("Alta", "Media", "Baja") to help commercial teams sort and schedule their retention visits.
- **`mensaje_para_vendedor`:** A short, actionable pitch or key phrase the sales representative can say during their visit, written in Mexican Spanish.

---

## Section 7 — Console Verification Guide

This checklist enables judges to verify each capability is running live during the demo:

1. **Verify Google Search Grounding & Thinking:**
   - Open the browser developer tools (F12) and go to the **Network** tab.
   - Click **"Generar Análisis Inteligente"** on the Client Details page.
   - Look for the outgoing POST request to `generativelanguage.googleapis.com`.
   - Inspect the request payload: confirm `google_search: {}` is present in the `tools` array, and `thinkingBudget` is set to `2048` inside `generationConfig`.
2. **Verify Streaming Responses:**
   - On the same request, view the response stream. Confirm that text chunks appear progressively in the UI instead of loading all at once.
3. **Verify Function Calling Interceptor:**
   - Go to the follow-up chat at the bottom right.
   - Type and submit: *"¿Me puedes dar el detalle de mis ventas mensuales?"*
   - Observe the browser console. Confirm that Gemini triggers a function call, and the console prints: `Gemini API requested monthly history via function call part: ...`. The local interceptor catches this call and feeds the historical array back to the API.

---

## Section 8 — Why Gemini, Not Just the ML Model

The machine learning model acts as the detector (producing scores, risk tiers, and cold statistical indicators like `Perdió enfriador`). However, this data is sterile and lacks real-world meaning for a salesperson. Gemini bridges this gap. It contextualizes the ML outputs into a human narrative. For instance, in the case of the kiosk client in Guadalajara, the ML model flags a cooler loss and drop in sales. Gemini takes these two data points, looks up local business conditions in Guadalajara, and synthesizes them: explaining that losing the cooler directly caused the store to lose its cold-beverage sales advantage to a nearby convenience store, advising the salesperson to offer a replacement cooler package immediately. This turns data into conversion.
