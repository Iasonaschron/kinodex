import { Router } from "express";
import bcrypt from "bcrypt";
import { signAccess, signRefresh, verifyRefresh } from "../../auth/jwt.js";
import { pool } from "../db/pool.js";
import { requireAuth } from "../../middleware/requireAuth.js"

export const router = Router();

function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // keep false in dev if not on HTTPS
    sameSite: "strict",
    path: "/api/auth",
  });
}

// REGISTER
router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: "username, email, password required" });

    const hash = await bcrypt.hash(password, 12);

    // Assuming users has columns: username (PK), email (UNIQUE), password_hash, token_version (DEFAULT 0)
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING username, email, token_version`,
      [username, email, hash]
    );
    const u = rows[0];

    // JWTs now keyed by username
    const access = signAccess({ username: u.username, token_version: u.token_version });
    const refresh = signRefresh({ username: u.username, token_version: u.token_version });
    setRefreshCookie(res, refresh);

    res.status(201).json({
      accessToken: access,
      user: { username: u.username, email: u.email },
    });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Username or email already exists" });
    next(e);
  }
});

// LOGIN (identifier = username OR email)
router.post("/login", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "username, email, password required" });
    }

    const { rows } = await pool.query(
      `SELECT username, email, password_hash, token_version
       FROM users
       WHERE username = $1 AND email = $2`,
      [username, email]
    );
    const u = rows[0];
    if (!u) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, u.password_hash || "");
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const access = signAccess({ username: u.username, token_version: u.token_version });
    const refresh = signRefresh({ username: u.username, token_version: u.token_version });
    setRefreshCookie(res, refresh);

    res.json({
      accessToken: access,
      user: { username: u.username, email: u.email },
    });
  } catch (e) {
    next(e);
  }
});


// REFRESH (uses cookie; payload carries username)
router.post("/refresh", async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: "Missing refresh token" });

  try {
    const payload = verifyRefresh(token); // { username, token_version, iat, exp }

    const { rows } = await pool.query(
      `SELECT username, email, token_version
       FROM users
       WHERE username = $1`,
      [payload.username]
    );
    const u = rows[0];
    if (!u || u.token_version !== payload.token_version)
      return res.status(401).json({ error: "Refresh token invalidated" });

    const newAccess = signAccess({ username: u.username, token_version: u.token_version });
    const newRefresh = signRefresh({ username: u.username, token_version: u.token_version });

    setRefreshCookie(res, newRefresh); // rotate
    res.json({
      accessToken: newAccess,
      user: { username: u.username, email: u.email },
    });
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

// LOGOUT (invalidate by bumping token_version)
router.post("/logout", async (req, res) => {
  const t = req.cookies?.refreshToken;
  if (t) {
    try {
      const { username } = verifyRefresh(t);
      await pool.query(
        `UPDATE users SET token_version = token_version + 1 WHERE username = $1`,
        [username]
      );
    } catch { /* ignore */ }
  }
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
  res.status(204).end();
});

// Frontend must send: Authorization: Bearer <accessToken>
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    // req.user came from verifyAccess(token) in requireAuth:
    const { rows } = await pool.query(
      `SELECT username, email, token_version
       FROM users
       WHERE username = $1`,
      [req.user.username]
    );
    const u = rows[0];

    if (!u) return res.status(404).json({ error: "User not found" });

    // Ensure the access token wasn't revoked by logout/rotation
    if (u.token_version !== req.user.token_version) {
      return res.status(401).json({ error: "Token revoked" });
    }

    // Return a minimal, safe shape
    res.json({ username: u.username, email: u.email });
  } catch (e) {
    next(e);
  }
});
