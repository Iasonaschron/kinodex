import {Router} from "express";
import {router as users} from "./users.js";
import {router as movies} from "./movies.js";
import {router as lists} from "./lists.js";
import { router as authRoutes } from "./auth.js";
import { router as recommendations } from "./recommendations.js";
import { router as semanticSearch } from "./search.js";

export const router = Router();

router.use("/users", users);
router.use("/movies", movies);
router.use("/lists", lists);
router.use("/auth", authRoutes);
router.use("/recommendations", recommendations);
router.use("/semantic-search", semanticSearch);