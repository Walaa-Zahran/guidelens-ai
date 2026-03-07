import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in backend/.env");
}

const ai = new GoogleGenAI({ apiKey });

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

    try {
        const cleaned = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleaned);
    } catch {
        return {
            screenSummary: text,
            taskGuess: "User needs help with the current screen or task.",
            nextAction: "Ask the user to share a screen or provide more context.",
            warning: ""
        };
    }
}