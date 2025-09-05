import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles.css";
import { useAuth } from "../auth/AuthProvider";

export default function Login() {
  const [username, setUsername] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
  document.body.classList.add("auth-page");
  return () => document.body.classList.remove("auth-page");
}, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, email, password);
      navigate("/dashboard");
    } catch (e) {
      setError(e.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <section className="auth-card">
        <header className="auth-header">
          <h1 className="auth-brand">Kinodex</h1>
          <span className="auth-subtitle">Log in</span>
        </header>

        <form className="auth-form" id="login" onSubmit={onSubmit} noValidate>
          {error && (
            <p className="auth-error" role="alert">{error}</p>
          )}

          <div className="auth-field">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              name="username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="auth-meta">
            No account? <Link to="/signup">Create one</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
