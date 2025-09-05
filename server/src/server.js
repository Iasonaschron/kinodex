import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { router as api } from "./routes/index.js";

dotenv.config();

const app = express();

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:3000"], credentials: true }));

app.use(express.json());
app.use(cookieParser());

app.use("/health", (_req, res) => {
    res.json({ ok: true });
});

app.use("/api", api);

app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "Server error" });
});

const port = process.env.PORT || 3001;

app.listen(port, () => console.log(`API running on http://localhost:${port}`));