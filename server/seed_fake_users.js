/**
 * Seed script: insert 5 fake users with varied movie lists.
 *
 * Run from the server/ directory:
 *   node seed_fake_users.js
 *
 * All seed accounts use the password "kinodex123".
 * The users are prefixed with "seed_" so they're easy to identify and clean up.
 *
 * The movie sets are intentionally overlapping in different ways so that the
 * MinHash + LSH collaborative filter has interesting signal to work with:
 *   - seed_alice  : heavy sci-fi fan
 *   - seed_bob    : crime / drama fan, some overlap with alice
 *   - seed_carol  : thriller / dark films, overlaps with alice and bob
 *   - seed_dave   : sci-fi + epic fantasy, strongly overlaps with alice
 *   - seed_eve    : action / adventure, overlaps with alice, carol, and dave
 */

import bcrypt from "bcrypt";
import { pool } from "./src/db/pool.js";
import dotenv from "dotenv";

dotenv.config();

const SEED_PASSWORD = "kinodex123";
const SALT_ROUNDS = 10;

// ---------------------------------------------------------------------------
// User definitions
// ---------------------------------------------------------------------------

const USERS = [
    { username: "seed_alice", email: "alice@seed.kinodex" },
    { username: "seed_bob",   email: "bob@seed.kinodex"   },
    { username: "seed_carol", email: "carol@seed.kinodex" },
    { username: "seed_dave",  email: "dave@seed.kinodex"  },
    { username: "seed_eve",   email: "eve@seed.kinodex"   },
];

// ---------------------------------------------------------------------------
// Movie sets (IMDb IDs)
// The overlap structure is what drives the collaborative-filter recommendations.
// ---------------------------------------------------------------------------

const USER_MOVIES = {
    seed_alice: [
        "tt0816692", // Interstellar
        "tt1375666", // Inception
        "tt0468569", // The Dark Knight
        "tt0080684", // The Empire Strikes Back
        "tt0062622", // 2001: A Space Odyssey
        "tt0083658", // Blade Runner
        "tt0097165", // Dead Poets Society
    ],
    seed_bob: [
        "tt0111161", // The Shawshank Redemption
        "tt0068646", // The Godfather
        "tt0110912", // Pulp Fiction
        "tt0073486", // One Flew Over the Cuckoo's Nest
        "tt0114369", // Se7en
        "tt0097165", // Dead Poets Society  ← overlaps with alice
        "tt0108052", // Schindler's List
    ],
    seed_carol: [
        "tt0083658", // Blade Runner         ← overlaps with alice
        "tt0068646", // The Godfather        ← overlaps with bob
        "tt0114369", // Se7en                ← overlaps with bob
        "tt1457767", // The Conjuring
        "tt0363988", // Saw
        "tt0137523", // Fight Club
        "tt0076759", // Star Wars: A New Hope
    ],
    seed_dave: [
        "tt0816692", // Interstellar          ← overlaps with alice
        "tt1375666", // Inception             ← overlaps with alice
        "tt0062622", // 2001: A Space Odyssey ← overlaps with alice
        "tt0167260", // The Return of the King
        "tt0120737", // The Fellowship of the Ring
        "tt0137523", // Fight Club            ← overlaps with carol
        "tt0108052", // Schindler's List      ← overlaps with bob
    ],
    seed_eve: [
        "tt0468569", // The Dark Knight       ← overlaps with alice
        "tt0076759", // Star Wars             ← overlaps with carol
        "tt0167260", // LOTR: Return of King  ← overlaps with dave
        "tt0120737", // LOTR: Fellowship      ← overlaps with dave
        "tt0102926", // The Silence of the Lambs
        "tt0080684", // The Empire Strikes Back ← overlaps with alice
        "tt0108052", // Schindler's List       ← overlaps with bob, dave
    ],
};

// ---------------------------------------------------------------------------
// Seed logic
// ---------------------------------------------------------------------------

async function seed() {
    console.log("Hashing seed password…");
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        for (const { username, email } of USERS) {
            // Insert user — skip silently if the username already exists.
            const { rows } = await client.query(
                `INSERT INTO users (username, email, password_hash, token_version)
                 VALUES ($1, $2, $3, 0)
                 ON CONFLICT (username) DO NOTHING
                 RETURNING username`,
                [username, email, passwordHash]
            );

            if (rows.length === 0) {
                console.log(`  ↳ ${username} already exists — skipping user insert`);
            } else {
                console.log(`  ✔ inserted user: ${username}`);
            }

            // Create a single list for this user — skip if it already exists.
            await client.query(
                `INSERT INTO lists (name, owner, description)
                 VALUES ($1, $2, $3)
                 ON CONFLICT DO NOTHING`,
                [`${username}-favs`, username, "Seed list for collaborative filtering"]
            );

            // Insert each movie into the list — skip duplicates.
            const movieIds = USER_MOVIES[username] ?? [];
            for (const movieId of movieIds) {
                await client.query(
                    `INSERT INTO movie_in_list (movie_id, list_name, list_owner)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (movie_id, list_name, list_owner) DO NOTHING`,
                    [movieId, `${username}-favs`, username]
                );
            }
            console.log(`  ✔ seeded ${movieIds.length} movies for ${username}`);
        }

        await client.query("COMMIT");
        console.log("\nSeed complete.");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Seed failed — rolled back:", err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
