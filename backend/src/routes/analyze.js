import express from "express";
import { analyzePromptOnly, analyzeScreenImage } from "../services/geminiService.js";
import {
  appendSessionHistory,
  getSessionSummary,
  resetSession,
  updateSession
} from "../services/sessionStore.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message, imageBase64, mimeType, sessionId } = req.body;

    const sessionContext = getSessionSummary(sessionId);

    let result;

    if (imageBase64) {
      result = await analyzeScreenImage(
        {
          message: message || "Analyze this screen and guide the user.",
          imageBase64,
          mimeType: mimeType || "image/png"
        },
        sessionContext
      );
    } else {
      if (!message || typeof message !== "string") {
        return res.status(400).json({
          ok: false,
          error: "A valid message is required"
        });
      }

      result = await analyzePromptOnly(message, sessionContext);
    }

    updateSession(sessionId, {
      currentTask: result.taskGuess,
      lastScreenSummary: result.screenSummary,
      lastNextAction: result.nextAction,
      lastWarning: result.warning,
      confidence: result.confidence
    });

    appendSessionHistory(sessionId, {
      userRequest: message || "",
      taskGuess: result.taskGuess,
      nextAction: result.nextAction,
      confidence: result.confidence
    });

    return res.json({
      ok: true,
      result,
      session: getSessionSummary(sessionId)
    });
  } catch (error) {
    console.error("Analyze route error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Something went wrong"
    });
  }
});

router.post("/reset-session", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        ok: false,
        error: "sessionId is required"
      });
    }

    const session = resetSession(sessionId);

    return res.json({
      ok: true,
      session
    });
  } catch (error) {
    console.error("Reset session error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Unable to reset session"
    });
  }
});

export default router;