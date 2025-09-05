import {Router} from "express";
import { getMovieById } from "../models/movies.js";

export const router = Router();

router.get("/:imdbId", async (req, res) => {
    try {
        const id = req.params.imdbId;

        if (!id) {
            res.status(400).json({error: "Bad request!"});
        }

        const movie = await getMovieById(id);

        if (!movie) {
            res.status(404).json({error: "Movie not found!"});
        }

        res.json(movie);

    } catch (err) {
        console.error(err);
    }
});