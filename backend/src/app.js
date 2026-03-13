import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import analyzeRouter from "./routes/analyze.js";
import { analyzePromptOnly } from "./services/geminiService.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (req, res) => {
    res.json({
        ok: true,
        message: "GuideLens backend is healthy"
    });
});

app.use("/api/analyze", analyzeRouter);

app.get("/test-gemini", async (req, res) => {
    try {
        const result = await analyzePromptOnly("Say hello from Gemini");

        res.json({
            ok: true,
            result
        });
    } catch (err) {
        res.json({
            ok: false,
            error: err.message
        });
    }
});
export default app;