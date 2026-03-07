import express from "express";
import { analyzePromptOnly } from "../services/geminiService.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== "string") {
            return res.status(400).json({
                ok: false,
                error: "A valid message is required"
            });
        }

        const result = await analyzePromptOnly(message);

        res.json({
            ok: true,
            result
        });
    } catch (error) {
        console.error("Analyze route error:", error);

        res.status(500).json({
            ok: false,
            error: error.message || "Something went wrong"
        });
    }
});

export default router;