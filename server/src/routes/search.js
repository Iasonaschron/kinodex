import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";

export const router = Router();

const PYTHON_SERVICE = process.env.SEMANTIC_SERVICE_URL ?? "http://localhost:5001";

/**
 * POST /api/semantic-search
 * Body: { query: string }
 *
 * Proxies the request to the Python sentence-transformers microservice and
 * returns the top matching movies from the MovieLens dataset.
 *
 * Response: { results: Array<{ title, year, genres, imdb_id, score }> }
 */
router.post("/", requireAuth, async (req, res, next) => {
    try {
        const { query } = req.body ?? {};
        if (!query || typeof query !== "string" || !query.trim()) {
            return res.status(400).json({ error: "query is required" });
        }

        let pyRes;
        try {
            pyRes = await fetch(`${PYTHON_SERVICE}/search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: query.trim(), top_k: 10 }),
            });
        } catch (networkErr) {
            // ECONNREFUSED means the Python service isn't running.
            const isDown = networkErr.cause?.code === "ECONNREFUSED"
                || networkErr.message?.includes("ECONNREFUSED")
                || networkErr.message?.includes("fetch failed");
            if (isDown) {
                return res.status(503).json({
                    error: "Semantic search service is not running. "
                        + "See README for setup instructions.",
                });
            }
            throw networkErr;
        }

        if (!pyRes.ok) {
            const body = await pyRes.text().catch(() => "");
            return res.status(502).json({
                error: `Semantic service returned ${pyRes.status}: ${body}`,
            });
        }

        const data = await pyRes.json();
        res.json(data);
    } catch (e) {
        next(e);
    }
});
