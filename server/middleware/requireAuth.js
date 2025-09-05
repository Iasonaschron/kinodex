// middleware/requireAuth.js
import { verifyAccess } from "../auth/jwt.js";

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing access token" });

  try {
    req.user = verifyAccess(token); // { username, token_version, iat, exp }
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
}
