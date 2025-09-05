import { pool } from "../db/pool.js";

export async function getUserByUsername(username) {
    const {rows} = await pool.query (
        "SELECT * FROM users AS u WHERE u.username = $1", [username]
    );
    return rows[0] || null;
}

export async function getUserByEmail(email) {
    const {rows} = await pool.query (
        "SELECT * FROM users WHERE email = $1", [email]
    );
    return rows[0] || null;
}

export async function createUser({username, email, gender, password}) {
    const {rows} = await pool.query (
        `INSERT INTO users (username, password, email, gender)
        VALUES ($1, $2, $3, $4)
        RETURNING username, email, gender, newsletter_opt_out, newsletter_last_date, avatar_image`,
        [username, password, email, gender ?? null]
    );
    return rows[0];
}

export async function updateUser(username, {password, email, gender, newsletter_opt_out, newsletter_last_date, avatar_image}) {
    const {rows} = await pool.query (
        `UPDATE users 
        SET 
        password = COALESCE($2, password),
        email = COALESCE($3, email),
        gender = COALESCE($4, gender),
        newsletter_opt_out = COALESCE($5, newsletter_opt_out),
        newsletter_last_date = COALESCE($6, newsletter_last_date),
        avatar_image = COALESCE($7, avatar_image)
        WHERE username = $1
        RETURNING username, email, gender, newsletter_opt_out, newsletter_last_date, avatar_image`,
        [username, password ?? null, email ?? null, gender ?? null, newsletter_opt_out ?? null, newsletter_last_date ?? null, avatar_image ?? null]
    );
    return rows[0] || null;
}

export async function deleteUser(username) {
    await pool.query (
        `DELETE FROM users WHERE username = $1`, [username]
    );
        return true
}