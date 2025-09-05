import { Router } from "express";
import { getUserByUsername, getUserByEmail, createUser, updateUser, deleteUser } from "../models/users.js";

export const router = Router();

router.post("/", async (req, res, next) => {
    try {

        const {username, email, gender, password} = req.body;
        if (!username || !email || !password) {
            res.status(400).json({error: "username, email and password are required"});
        }

        const taken = await getUserByUsername(username);
        if (taken) {
            return res.status(409).json({error: "username already in use!"});
        }

        const emailTaken = await getUserByEmail(email);
        if (emailTaken) return res.status(409).json({ error: "Email already in use" });

        const user = await createUser({ username, email, gender, password });
        res.status(201).json(user);
    } catch (e) {
        console.error(e);
        next(e); 
    }
})

router.get("/:username", async (req, res) => {

    try {
        const username = req.params.username;

        if (!username) {
            return res.status(400).json({error: "Bad request!"});
        }

        const user = await getUserByUsername(username);

        if (!user) {
            return res.status(404).json({error: "User not found!"});
        }

        res.json(user);     

    } catch (err) {
        console.error(err);
    }

});

router.patch("/:username", async (req, res, next) => {

    try {
        const {password, email, gender, newsletter_opt_out, newsletter_last_date, avatar_image} = req.body;

        if (
            password == undefined &&
            email == undefined &&
            gender == undefined &&
            newsletter_opt_out == undefined &&
            newsletter_last_date == undefined &&
            avatar_image == undefined
        ) {
            res.status(400).json({error: "nothing to update!"});
        }

        const updated = await updateUser(req.params.username, {password, email, gender, newsletter_opt_out, newsletter_last_date, avatar_image});

        if (!updated) {
            res.status(404).json({error: "user not found!"});   
        }

        res.json(updated);

    } catch (e) {
        console.error(e);
        next(e);
    }
})

router.delete("/:username", async (req, res, next) => {
    try {
        await deleteUser(req.params.username);
        res.status(204).end();
    } catch (e) {
        next(e);
    }
})