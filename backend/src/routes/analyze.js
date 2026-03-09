import express from "express";
import { analyzePromptOnly, analyzeScreenImage } from "../services/geminiService.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { message, imageBase64, mimeType } = req.body;

        if (imageBase64) {
            const result = await analyzeScreenImage({
                message: message || "Analyze this screen and guide the user.",
                imageBase64,
                mimeType: mimeType || "image/png"
            });

            return res.json({
                ok: true,
                result
            });
        }

        if (!message || typeof message !== "string") {
            return res.status(400).json({
                ok: false,
                error: "A valid message is required"
            });
        }

        const result = await analyzePromptOnly(message);

        return res.json({
            ok: true,
            result
        });
    } catch (error) {
        console.error("Analyze route error:", error);

        return res.status(500).json({
            ok: false,
            error: error.message || "Something went wrong"
        });
    }
});

export default router;