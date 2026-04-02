import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { pool } from "../db/pool.js";
import { getRecommendations } from "../../recommender/minhash.js";

export const router = Router();

/**
 * GET /api/recommendations
 *
 * Returns up to 10 personalised movie IDs for the authenticated user,
 * computed via MinHash + LSH collaborative filtering.
 *
 * The algorithm treats every user's combined saved-movie set (across all their
 * lists) as a single "taste profile" and finds users with similar profiles.
 * Movies saved by those similar users but not yet by the current user are
 * returned as recommendations.
 *
 * Response: { recommendations: string[] }   — array of IMDb movie IDs
 */
router.get("/", requireAuth, async (req, res, next) => {
    try {
        const targetUser = req.user.username;

        // Fetch all (user, movie_id) pairs in one query — one round-trip.
        const { rows } = await pool.query(
            `SELECT list_owner, movie_id FROM movie_in_list`
        );

        // Build a map: username → Set<movie_id>
        // Each user's entries across all their lists are merged into one set.
        const userMovies = {};
        for (const { list_owner, movie_id } of rows) {
            if (!userMovies[list_owner]) userMovies[list_owner] = new Set();
            userMovies[list_owner].add(movie_id);
        }

        // If this user has no saved movies yet, return the most popular movies
        // saved by other users as a "popular picks" fallback.
        if (!userMovies[targetUser]) {
            const counts = new Map();
            for (const [user, movieSet] of Object.entries(userMovies)) {
                for (const id of movieSet) {
                    counts.set(id, (counts.get(id) || 0) + 1);
                }
            }
            const popular = [...counts.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([id]) => id);
            return res.json({ recommendations: popular });
        }

        const recommendations = getRecommendations(targetUser, userMovies);

        res.json({ recommendations });
    } catch (e) {
        next(e);
    }
});
