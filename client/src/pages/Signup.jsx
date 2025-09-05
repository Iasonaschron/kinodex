import React, { useState, useEffect  } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles.css";
import { signup } from "../api";
import { useAuth } from "../auth/AuthProvider";

export default function Signup() {
  const [form, setForm] = useState({
    username: "", email: "", password: "", confirm: ""
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
  document.body.classList.add("auth-page");
  return () => document.body.classList.remove("auth-page");
}, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await signup({
        username: form.username.trim(),
        email:    form.email.trim(),
        password: form.password
      });
      await login(form.username, form.email, form.password);
      navigate("/dashboard");
    } catch (e) {
      setError(e.message || "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <section className="auth-card">
        <header className="auth-header">
          <h1 className="auth-brand">Kinodex</h1>
          <span className="auth-subtitle">Create account</span>
        </header>

        <form className="auth-form" id="signup" onSubmit={onSubmit} noValidate>
          {error && (
            <p className="auth-error" role="alert">{error}</p>
          )}

          <div className="auth-field">
            <label htmlFor="su-username">Username</label>
            <input
              id="su-username"
              type="text"
              name="username"
              autoComplete="username"
              required
              value={form.username}
              onChange={onChange}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="su-email">Email</label>
            <input
              id="su-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={onChange}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="su-password">Password</label>
            <input
              id="su-password"
              type="password"
              name="password"
              autoComplete="new-password"
              minLength={6}
              required
              value={form.password}
              onChange={onChange}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="su-confirm">Confirm password</label>
            <input
              id="su-confirm"
              type="password"
              name="confirm"
              autoComplete="new-password"
              minLength={6}
              required
              value={form.confirm}
              onChange={onChange}
            />
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </button>

          <p className="auth-meta">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
