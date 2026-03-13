import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in backend/.env");
}

const ai = new GoogleGenAI({ apiKey });

function normalizeResponse(parsed, fallbackText = "") {
    return {
        screenSummary: parsed?.screenSummary || fallbackText || "Unable to analyze the screen clearly.",
        taskGuess: parsed?.taskGuess || "The user likely needs help with the current UI or task.",
        nextAction: parsed?.nextAction || "Ask the user to provide a clearer screen or more detail.",
        warning: parsed?.warning || "",
        confidence: parsed?.confidence || "Medium",
        steps: Array.isArray(parsed?.steps) && parsed.steps.length
            ? parsed.steps.slice(0, 3)
            : [
                { title: "Inspect visible UI", status: "done" },
                { title: "Infer likely task", status: "done" },
                { title: "Recommend next step", status: "current" }
            ]
    };
}

function safeParseJson(text) {
    try {
        const cleaned = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleaned);
    } catch {
        return null;
    }
}

export async function analyzePromptOnly(userMessage) {
    const systemPrompt = `
You are GuideLens AI, a real-time on-screen assistant.

Return STRICT JSON in this exact shape:
{
  "screenSummary": "string",
  "taskGuess": "string",
  "nextAction": "string",
  "warning": "string",
  "confidence": "High | Medium | Low",
  "steps": [
    { "title": "string", "status": "done | current | upcoming" },
    { "title": "string", "status": "done | current | upcoming" },
    { "title": "string", "status": "done | current | upcoming" }
  ]
}

Rules:
- Keep each field concise.
- Infer from the user's message if no image is provided.
- steps must contain exactly 3 items.
- warning may be empty.
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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
    const parsed = safeParseJson(text);
    return normalizeResponse(parsed, text);
}

export async function analyzeScreenImage({ message, imageBase64, mimeType }) {
    const prompt = `
You are GuideLens AI, a real-time screen-aware assistant.

Analyze the provided screenshot and return STRICT JSON in this exact shape:
{
  "screenSummary": "string",
  "taskGuess": "string",
  "nextAction": "string",
  "warning": "string",
  "confidence": "High | Medium | Low",
  "steps": [
    { "title": "string", "status": "done | current | upcoming" },
    { "title": "string", "status": "done | current | upcoming" },
    { "title": "string", "status": "done | current | upcoming" }
  ]
}

Rules:
- Be concise.
- Describe the visible UI.
- Infer the user's likely task.
- Recommend the single best next step.
- Provide exactly 3 steps.
- warning may be empty.
- Do not wrap JSON in markdown fences.

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
    const parsed = safeParseJson(text);
    return normalizeResponse(parsed, text);
}