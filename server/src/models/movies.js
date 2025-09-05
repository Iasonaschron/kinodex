import {pool} from "../db/pool.js";

export async function getMovieById(id) {
    const {rows} = await pool.query(
        "SELECT * FROM movies AS m WHERE m.id = $1", [id]
    );
    return rows[0] || null;
}