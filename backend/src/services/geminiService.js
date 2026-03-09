import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in backend/.env");
}

const ai = new GoogleGenAI({ apiKey });
function safeParseJson(text) {
    try {
        const cleaned = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleaned);
    } catch {
        return null;
    }
}

function fallbackResult(text) {
    return {
        screenSummary: text || "Unable to parse model response.",
        taskGuess: "The user likely needs help with the visible screen.",
        nextAction: "Ask the user to share a clearer screen or provide more context.",
        warning: ""
    };
}

export async function analyzePromptOnly(userMessage) {
    const systemPrompt = `
You are GuideLens AI, a real-time on-screen assistant.
Respond clearly and briefly.

Return your answer in this exact JSON shape:
{
  "screenSummary": "string",
  "taskGuess": "string",
  "nextAction": "string",
  "warning": "string"
}

Rules:
- Keep each field short.
- If no actual screen is provided, infer from the user's message only.
- warning can be an empty string.
`;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: `${systemPrompt}\n\nUser message: ${userMessage}`
                    }
                ]
            }
        ]
    });

    const text = response.text;
    return safeParseJson(text) || fallbackResult(text);

}
export async function analyzeScreenImage({ message, imageBase64, mimeType }) {
    const prompt = `
You are GuideLens AI, a real-time screen-aware assistant.

Analyze the provided screenshot and return STRICT JSON in this exact shape:
{
  "screenSummary": "string",
  "taskGuess": "string",
  "nextAction": "string",
  "warning": "string"
}

Rules:
- Be concise.
- Describe the visible UI.
- Infer the user's likely task.
- Recommend the single best next step.
- warning can be empty if nothing seems wrong.
- Do not wrap the JSON in markdown fences.
- If the screen is unclear, say so in warning.
User request: ${message}
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            {
                inlineData: {
                    mimeType,
                    data: imageBase64
                }
            },
            {
                text: prompt
            }
        ]
    });

    const text = response.text;
    return safeParseJson(text) || fallbackResult(text);
}