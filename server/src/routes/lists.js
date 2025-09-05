import { Router } from "express";
import { addMovieToList, getMoviesByList, getListsByUser, deleteMovieFromList, createList, deleteList, getListDescription, updateList } from "../models/lists.js";

export const router = Router();

//add movie to list
router.post("/:owner/:list/items", async (req, res, next) => {
    try {
        const { movie_id } = req.body;

        if (!movie_id) return res.status(400).json({ error: "movie_id is required" });

        const addedMovie = await addMovieToList(movie_id, req.params.list, req.params.owner);

        if (!addedMovie) {
            return res.status(409).json({ error: "Movie already in list" });
        }
        res.status(201).json(addedMovie);

    } catch (e) {
        next(e);
    }
})

//view movies in list
router.get("/:owner/:list/items", async (req, res, next) => {
    try {
        const { owner, list } = req.params;
        const { page, limit } = req.query;

        const movies = await getMoviesByList(list, owner, page, limit);

        res.status(200).json(movies);

    } catch (e) {
        next(e);
    }
})

//view lists by user
router.get("/:owner", async (req, res, next) => {
    try {
        const { owner } = req.params;

        const lists = await getListsByUser(owner);

        if (!lists) {
            res.status(404).json({ error: "Lists not found!" });
        }

        res.status(200).json(lists);
    } catch (e) {
        next(e);
    }
})

//delete movie from list
router.delete("/:owner/:list/items/:movie_id", async (req, res, next) => {
    try {
        const { owner, list, movie_id } = req.params;

        const deleted = await deleteMovieFromList(movie_id, list, owner)

        if (!deleted) {
            res.status(404).json({ error: "Couldn't find movie!" });
        }

        res.status(204).end();
    } catch (e) {
        next(e);
    }
})

//delete list
router.delete("/:owner/:list", async (req, res, next) => {

    try {
        const { owner, list } = req.params;

        const deleted = await deleteList(owner, list);

        if (!deleted) {
            res.status(404).json({ error: "Couldn't find list!" });
        }

        res.status(204).end();

    } catch (e) {
        next(e);
    }

})

//create new list
router.post("/:owner", async (req, res, next) => {
    try {
        const { owner } = req.params;
        const { title, description } = req.body;

        if (!owner || !title) {
            res.status(400).json({ error: "Bad request!" });
        }

        const list = await createList(owner, title, description);

        if (!list) {
            res.status(400).json({ error: "Bad request. Either this list tile already exists or owner diesnt exist!" });
        }

        res.status(201).json(list);
    } catch (e) {
        next(e);
    }
})

//get list description
router.get("/:owner/:list/description", async (req, res, next) => {
    try {
        const { owner, list } = req.params;

        if (!owner) {
            res.status(400).json({ error: "Bad request!" });
        }

        const description = await getListDescription(owner, list);

        if (!description) {
            res.status(404).json({ error: "Description not found!" });
        }

        res.status(200).json(description);

    } catch {
        next(e);
    }
})

//update list description
router.post("/owner/:list/description", async (req, res, next) => {
    try {
        const { owner, list } = req.params;
        const { description } = req.body;

        if (!owner || !list) {
            res.status(400).json({error: "Bad request!"});
        }

        const updated = await updateList(list, owner, description);

        if (!updated) {
            res.status(404).json({error: "List not found!"});
        }

        res.status(201).json(updated);
    } catch (e) {
        next(e);
    }
})
