import {Router} from "express";
import {router as users} from "./users.js";
import {router as movies} from "./movies.js";
import {router as lists} from "./lists.js";
import { router as authRoutes } from "./auth.js";

export const router = Router();

router.use("/users", users);
router.use("/movies", movies);
router.use("/lists", lists);
router.use("/auth", authRoutes);