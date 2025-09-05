import { pool } from "../db/pool.js";

export async function createList(owner, list_name, description) {
  const { rows } = await pool.query(
    `INSERT INTO lists (name, owner, description)
            VALUES ($1, $2, $3) RETURNING *`, [list_name, owner, description]
  );
  return rows[0];
}

export async function getListsByUser(owner) {
  const { rows } = await pool.query(
    `
            SELECT * FROM lists WHERE owner = $1
            `, [owner]
  );
  return rows || null;
}

export async function getMoviesByList(list_name, list_owner) {
  const { rows } = await pool.query(
    `SELECT movie_id FROM movie_in_list WHERE list_name = $1 AND list_owner = $2`, [list_name, list_owner]
  );
  return rows || null;
}

export async function getMoviesByListPage(list_name, list_owner, page = 1, limit = 20) {
  page = Number.isFinite(+page) && +page > 0 ? +page : 1;
  limit = Number.isFinite(+limit) && +limit > 0 ? Math.min(+limit, 100) : 20;

  //find the offset in the rows
  const offset = (page - 1) * limit;

  //find count of total pages
  const rowCountRes = await pool.query(
    `
        SELECT COUNT(mil.movie_id)::int AS total FROM movie_in_list AS mil
        WHERE mil.list_name = $1 AND mil.list_owner = $2
        `, [list_name, list_owner]
  );

  const totalRow = rowCountRes.rows[0];
  const total = totalRow ? totalRow.total : 0;

  //find actual rows 
  const movieRows = await pool.query(
    `
        SELECT movie_id FROM movie_in_list 
        WHERE list_name = $1 AND list_owner = $2
        ORDER BY movie_id ASC
        OFFSET $3 LIMIT $4
        `, [list_name, list_owner, offset, limit]
  );

  const moviesInPage = movieRows.rows;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return { moviesInPage, totalPages, page, total, limit };
}

export async function updateList(list_name, list_owner, description) {
  const { rows } = await pool.query(
    `
            UPDATE lists
            SET description = COALESCE($3, description)
            WHERE name = $1 AND owner = $2
            RETURNING *
            `, [list_name, list_owner, description ?? null]
  );
  return rows[0] || null;
}

export async function addMovieToList(movie_id, list_name, list_owner) {
  const { rows } = await pool.query(
    `
            INSERT INTO movie_in_list (movie_id, list_name, list_owner)
            VALUES ($1, $2, $3)
            ON CONFLICT (movie_id, list_name, list_owner) DO NOTHING
            RETURNING *
            `, [movie_id, list_name, list_owner]
  );
  return rows[0] || null;
}

export async function deleteMovieFromList(movie_id, list_name, list_owner) {
  const { rowCount } = await pool.query(
    `
        DELETE FROM movie_in_list
        WHERE movie_id = $1 AND list_name = $2 AND list_owner = $3
        `, [movie_id, list_name, list_owner]
  )
  return rowCount > 0;
}

export async function deleteList(list_owner, list_name) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `DELETE FROM movie_in_list
        WHERE list_owner = $1 AND list_name = $2`,
      [list_owner, list_name]
    );

    const res = await client.query(
      `DELETE FROM lists
        WHERE owner = $1 AND name = $2`,
      [list_owner, list_name]
    );

    await client.query("COMMIT");

    return res.rowCount > 0;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function getListDescription(list_owner, list_name) {
  const { rows } = await pool.query(
    `
            SELECT description FROM lists WHERE owner = $1 AND name = $2
            `, [list_owner, list_name]
  );
  return rows[0] || null;

}
