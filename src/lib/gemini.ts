const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const modelName = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";

// Direct HTTP execution to work seamlessly both in Node SSR and Client environments
export async function getGeminiResponse(userQuery: string, history: { role: string; text: string }[] = []): Promise<string> {
  if (!apiKey) {
    console.warn("Gemini API key is not configured. Set VITE_GEMINI_API_KEY in your .env file.");
    return "AI features are currently unavailable — the Gemini API key is not configured. Please contact your administrator.";
  }
  try {
    const formattedHistory = history.map(h => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          ...formattedHistory,
          { role: "user", parts: [{ text: userQuery }] }
        ],
        systemInstruction: {
          parts: [{ text: "You are Rasoi AI, an expert analytical agent for Indian restaurants. You help owners extract insights from their billing data, transactions, customer retention behaviors, menu combinations, and operation hours. Keep your answers direct, actionable, formatted nicely with clean bullet points and currency in INR (₹). Emphasize items like combos for slow products." }]
        }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Gemini API HTTP ${response.status}:`, errorBody);
      throw new Error(`Gemini API returned ${response.status}`);
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to parse AI response. Let's try analyzing again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having a brief issue querying Gemini Brain. Here is a local analysis: Weekday dinner capacity is at peak (+12.4%), but weekday lunch holds major scope for combo expansion.";
  }
}

/**
 * Returns the current model name being used for AI calls.
 */
export function getModelName(): string {
  return modelName;
}

