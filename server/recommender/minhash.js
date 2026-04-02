/**
 * MinHash + LSH Collaborative Filtering
 * ======================================
 * High-level algorithm:
 *
 *  1. Each user's saved movie set is treated as a "set" for Jaccard similarity.
 *     Jaccard(A, B) = |A ∩ B| / |A ∪ B| — ranges from 0 (no overlap) to 1 (identical).
 *
 *  2. MinHash approximates Jaccard without comparing full sets.
 *     For each of NUM_HASHES random hash functions h_i, we compute:
 *       signature[i] = min over all movie_ids m in the set of h_i(m)
 *     The key property: P(sig_A[i] == sig_B[i]) == Jaccard(A, B).
 *
 *  3. LSH (Locality-Sensitive Hashing) banding finds *candidate* similar pairs
 *     without comparing all pairs of users:
 *     - Split each signature into BANDS bands of ROWS_PER_BAND values each.
 *     - Two users are candidates if they share the same band hash in ANY band.
 *     - At the chosen (bands=16, rows=8) config, pairs with Jaccard ≥ ~0.5 are
 *       very likely to become candidates; dissimilar pairs rarely do.
 *
 *  4. Among candidates, estimate Jaccard from signatures and rank by similarity.
 *
 *  5. Collect movies that top-K similar users have saved but the current user hasn't.
 *     Weight each candidate movie by how many similar users have it × their similarity.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const NUM_HASHES = 128;         // Length of each MinHash signature vector
const BANDS = 16;               // Number of LSH bands
const ROWS_PER_BAND = NUM_HASHES / BANDS; // 8 rows per band

// A large prime used in the universal hash family h(x) = (a*x + b) mod p.
// Must exceed the largest possible input value (IMDb numeric IDs top out ~15M).
const LARGE_PRIME = 4294967311; // 2^32 + 15, a proven prime

// ---------------------------------------------------------------------------
// Deterministic PRNG — Mulberry32
// ---------------------------------------------------------------------------
// We need repeatable random hash parameters so that signatures computed across
// separate invocations (or server restarts) are always comparable.

function mulberry32(seed) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ---------------------------------------------------------------------------
// Hash function parameters (generated once at module load)
// ---------------------------------------------------------------------------
// Each hash function is parameterised by (a, b):
//   h_i(x) = (a_i * x + b_i) mod LARGE_PRIME
// We use BigInt for the multiplication to avoid 53-bit float overflow.

function generateHashParams(count) {
    const rng = mulberry32(0xdeadbeef); // fixed seed → reproducible params
    const params = [];
    for (let i = 0; i < count; i++) {
        params.push({
            a: Math.floor(rng() * (LARGE_PRIME - 1)) + 1, // a in [1, p-1]
            b: Math.floor(rng() * LARGE_PRIME),            // b in [0, p-1]
        });
    }
    return params;
}

const HASH_PARAMS = generateHashParams(NUM_HASHES);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert an IMDb movie ID string (e.g. "tt0468569") to a non-negative integer.
 * We strip the "tt" prefix and parse the numeric part.
 * Falls back to a djb2-style string hash for non-standard IDs.
 */
function movieIdToInt(id) {
    const numeric = parseInt(String(id).replace(/\D/g, ""), 10);
    if (!isNaN(numeric)) return numeric;

    // Fallback: djb2 hash for any non-numeric ID
    let h = 5381;
    for (let i = 0; i < id.length; i++) {
        h = (Math.imul(h, 33) ^ id.charCodeAt(i)) >>> 0;
    }
    return h;
}

// ---------------------------------------------------------------------------
// Core MinHash
// ---------------------------------------------------------------------------

/**
 * Compute the MinHash signature for an iterable of movie ID strings.
 *
 * @param {Iterable<string>} movieIds
 * @returns {number[]} signature — array of NUM_HASHES minimum hash values
 */
function computeSignature(movieIds) {
    // Initialise signature with +Infinity so the first hash always wins.
    const signature = new Array(NUM_HASHES).fill(Infinity);

    for (const id of movieIds) {
        const x = BigInt(movieIdToInt(id));
        for (let i = 0; i < NUM_HASHES; i++) {
            const { a, b } = HASH_PARAMS[i];
            // (a * x + b) mod p — BigInt keeps this exact; convert back to Number.
            const hash = Number(
                (BigInt(a) * x + BigInt(b)) % BigInt(LARGE_PRIME)
            );
            if (hash < signature[i]) signature[i] = hash;
        }
    }

    return signature;
}

// ---------------------------------------------------------------------------
// LSH Index
// ---------------------------------------------------------------------------

/**
 * Build an LSH index from a username → signature map.
 *
 * For each band b, we concatenate the ROWS_PER_BAND signature values to form
 * a bucket key. Users whose bucket keys collide in any band are candidates.
 *
 * @param {Object.<string, number[]>} signatures  { username → signature }
 * @returns {Map<string, Set<string>>[]}  one Map per band: bucketKey → usernames
 */
function buildLSHIndex(signatures) {
    // Allocate one Map per band.
    const bands = Array.from({ length: BANDS }, () => new Map());

    for (const [username, sig] of Object.entries(signatures)) {
        for (let b = 0; b < BANDS; b++) {
            const start = b * ROWS_PER_BAND;
            // Join the slice into a string key — compact and collision-resistant
            // for the range of hash values we produce.
            const bucketKey = sig.slice(start, start + ROWS_PER_BAND).join(",");

            if (!bands[b].has(bucketKey)) bands[b].set(bucketKey, new Set());
            bands[b].get(bucketKey).add(username);
        }
    }

    return bands;
}

/**
 * Find candidate similar users for a given user using the pre-built LSH index.
 * A user is a candidate if they share ANY band bucket with the query user.
 *
 * @param {string}    username
 * @param {number[]}  signature
 * @param {Map[]}     bands      — the LSH index from buildLSHIndex
 * @returns {Set<string>}        — candidate usernames (excluding the query user)
 */
function findCandidates(username, signature, bands) {
    const candidates = new Set();

    for (let b = 0; b < BANDS; b++) {
        const start = b * ROWS_PER_BAND;
        const bucketKey = signature.slice(start, start + ROWS_PER_BAND).join(",");
        const bucket = bands[b].get(bucketKey);
        if (bucket) {
            for (const u of bucket) {
                if (u !== username) candidates.add(u);
            }
        }
    }

    return candidates;
}

// ---------------------------------------------------------------------------
// Jaccard estimation from signatures
// ---------------------------------------------------------------------------

/**
 * Estimate Jaccard(A, B) from their MinHash signatures.
 * The estimate equals (# matching positions) / NUM_HASHES.
 *
 * @param {number[]} sigA
 * @param {number[]} sigB
 * @returns {number} estimated Jaccard in [0, 1]
 */
function estimateJaccard(sigA, sigB) {
    let matches = 0;
    for (let i = 0; i < NUM_HASHES; i++) {
        if (sigA[i] === sigB[i]) matches++;
    }
    return matches / NUM_HASHES;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate personalised movie recommendations for a user via MinHash + LSH.
 *
 * @param {string}   targetUser  — username to recommend for
 * @param {Object.<string, Set<string>>} userMovies
 *                              — map of every user's saved movie ID set
 * @param {number}   topK       — how many most-similar users to draw from
 * @param {number}   topN       — maximum number of movie IDs to return
 * @returns {string[]}           — recommended movie IDs, best-first
 */
export function getRecommendations(targetUser, userMovies, topK = 5, topN = 10) {
    const targetMovies = userMovies[targetUser];

    // If the target user has no saved movies we cannot recommend anything.
    if (!targetMovies || targetMovies.size === 0) return [];

    // --- Step 1: Compute MinHash signatures for every user with at least 1 movie ---
    const signatures = {};
    for (const [user, movies] of Object.entries(userMovies)) {
        if (movies.size > 0) {
            signatures[user] = computeSignature(movies);
        }
    }

    const targetSig = signatures[targetUser];
    if (!targetSig) return [];

    // --- Step 2: Build LSH index and find candidates ---
    const bands = buildLSHIndex(signatures);
    const candidates = findCandidates(targetUser, targetSig, bands);

    // If LSH finds no candidates (very sparse data), fall back to comparing
    // all other users directly so we still return something useful.
    if (candidates.size === 0) {
        for (const u of Object.keys(signatures)) {
            if (u !== targetUser) candidates.add(u);
        }
    }

    // --- Step 3: Rank candidates by estimated Jaccard similarity ---
    const ranked = [];
    for (const candidate of candidates) {
        const sim = estimateJaccard(targetSig, signatures[candidate]);
        ranked.push({ user: candidate, similarity: sim });
    }
    ranked.sort((a, b) => b.similarity - a.similarity);

    // --- Step 4: Collect unseen movies, weighted by similarity ---
    // score(movie) = Σ similarity(recommending_user) for each user who has it.
    const scores = new Map(); // movieId → cumulative score
    for (const { user, similarity } of ranked.slice(0, topK)) {
        for (const movieId of userMovies[user]) {
            if (!targetMovies.has(movieId)) {
                scores.set(movieId, (scores.get(movieId) ?? 0) + similarity);
            }
        }
    }

    // --- Step 5: Return top-N recommendations sorted by score ---
    return [...scores.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([id]) => id);
}
