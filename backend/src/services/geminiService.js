import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in backend/.env");
}

const ai = new GoogleGenAI({ apiKey });

const VALID_POSITION_HINTS = [
    "top-left",
    "top-center",
    "top-right",
    "center-left",
    "center",
    "center-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
];

function normalizePositionHint(value) {
    if (VALID_POSITION_HINTS.includes(value)) {
        return value;
    }

    return "center";
}

function normalizeSteps(steps) {
    if (Array.isArray(steps) && steps.length) {
        return steps.slice(0, 3);
    }

    return [
        { title: "Inspect visible UI", status: "done" },
        { title: "Infer likely task", status: "done" },
        { title: "Recommend next step", status: "current" },
    ];
}

function normalizeConfidence(value) {
    const allowed = ["High", "Medium", "Low"];
    return allowed.includes(value) ? value : "Medium";
}

function buildFallbackResponse(fallbackText = "", sessionContext = {}) {
    const unclearWarning =
        "The screen or request may be unclear. Try sharing a clearer view or asking a more specific question.";

    return {
        screenSummary: fallbackText || "Unable to analyze the screen clearly.",
        taskGuess:
            sessionContext.currentTask ||
            "The user likely needs help with the current UI or task.",
        nextAction: "Ask the user to provide a clearer screen or more detail.",
        warning: unclearWarning,
        confidence: "Low",
        steps: [
            { title: "Inspect visible UI", status: "done" },
            { title: "Detect uncertainty", status: "done" },
            { title: "Request clearer context", status: "current" },
        ],
        targetElement: "Relevant UI area",
        positionHint: "center",
        needsClarification: true,
    };
}

function normalizeResponse(parsed, fallbackText = "", sessionContext = {}) {
    if (!parsed) {
        return buildFallbackResponse(fallbackText, sessionContext);
    }

    const normalized = {
        screenSummary:
            parsed.screenSummary ||
            fallbackText ||
            "Unable to analyze the screen clearly.",
        taskGuess:
            parsed.taskGuess ||
            sessionContext.currentTask ||
            "The user likely needs help with the current UI or task.",
        nextAction:
            parsed.nextAction ||
            "Ask the user to provide a clearer screen or more detail.",
        warning: parsed.warning || "",
        confidence: normalizeConfidence(parsed.confidence),
        steps: normalizeSteps(parsed.steps),
        targetElement: parsed.targetElement || "Relevant UI area",
        positionHint: normalizePositionHint(parsed.positionHint),
        needsClarification: Boolean(parsed.needsClarification),
    };

    if (normalized.confidence === "Low" && !normalized.warning) {
        normalized.warning =
            "The result may be uncertain. Try a clearer screen or a more specific question.";
    }

    return normalized;
}

function safeParseJson(text) {
    try {
        const cleaned = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleaned);
    } catch {
        return null;
    }
}

function buildSessionContextText(sessionContext = {}) {
    const historyText = Array.isArray(sessionContext.history)
        ? sessionContext.history
            .slice(-3)
            .map((item, index) => {
                return `History ${index + 1}:
- userRequest: ${item.userRequest || ""}
- taskGuess: ${item.taskGuess || ""}
- nextAction: ${item.nextAction || ""}
- confidence: ${item.confidence || ""}`;
            })
            .join("\n")
        : "";

    return `
Session context:
- currentTask: ${sessionContext.currentTask || ""}
- lastScreenSummary: ${sessionContext.lastScreenSummary || ""}
- lastNextAction: ${sessionContext.lastNextAction || ""}
- lastWarning: ${sessionContext.lastWarning || ""}
- confidence: ${sessionContext.confidence || ""}
${historyText}
`;
}

export async function analyzePromptOnly(userMessage, sessionContext = {}) {
    const systemPrompt = `
You are GuideLens AI, a reliable real-time on-screen assistant.

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
  ],
  "targetElement": "string",
  "positionHint": "top-left | top-center | top-right | center-left | center | center-right | bottom-left | bottom-center | bottom-right",
  "needsClarification": true
}

Rules:
- Keep each field concise.
- Infer from the user's message if no image is provided.
- steps must contain exactly 3 items.
- warning may be empty.
- targetElement should describe the most relevant area to focus on next.
- positionHint must be one of the allowed values.
- Set needsClarification to true only if the request is too vague or uncertain.
- If confidence is low, provide a helpful warning and safer next action.
`;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: `${systemPrompt}

                        ${buildSessionContextText(sessionContext)}

                        User message: ${userMessage}`,
                    },
                ],
            },
        ],
    });

    const text = response.text;
    const parsed = safeParseJson(text);
    return normalizeResponse(parsed, text, sessionContext);
}

export async function analyzeScreenImage(
    { message, imageBase64, mimeType },
    sessionContext = {},
) {
    const prompt = `
You are GuideLens AI, a reliable real-time screen-aware assistant.

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
  ],
  "targetElement": "string",
  "positionHint": "top-left | top-center | top-right | center-left | center | center-right | bottom-left | bottom-center | bottom-right",
  "needsClarification": true
}

Rules:
- Be concise.
- Describe the visible UI.
- Infer the user's likely task.
- Recommend the single best next step.
- Provide exactly 3 steps.
- warning may be empty.
- targetElement should name the area or UI element the user should focus on.
- positionHint must be one of the allowed 9 positions.
- Set needsClarification to true only if the screen is unclear or the request is too vague.
- If confidence is low, explain the uncertainty and recommend a safer next step.
- Do not wrap JSON in markdown fences.

${buildSessionContextText(sessionContext)}

User request: ${message}
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            {
                inlineData: {
                    mimeType,
                    data: imageBase64,
                },
            },
            {
                text: prompt,
            },
        ],
    });

    const text = response.text;
    const parsed = safeParseJson(text);
    return normalizeResponse(parsed, text, sessionContext);
}
