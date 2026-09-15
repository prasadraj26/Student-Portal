import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoMark}>EP</div>
          <span style={styles.logoText}>EduPortal</span>
        </div>

        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Sign in to your teacher account to continue.</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
            disabled={loading}
          >
            {loading ? <><span className="spinner" style={{borderTopColor:"#fff",borderColor:"rgba(255,255,255,0.3)"}} />Signing in…</> : "Sign in"}
          </button>
        </form>

        <p style={styles.footer}>
          Student Exam Portal &mdash; Teacher Administration
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", padding: 20,
    background: "linear-gradient(135deg, #0A1F44 0%, #1a3a6e 50%, #0d2855 100%)",
  },
  card: {
    background: "#fff", borderRadius: 20, padding: "36px 40px",
    width: "100%", maxWidth: 420,
    boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
    animation: "slideUp 0.3s ease",
  },
  logoRow: {
    display: "flex", alignItems: "center", gap: 10, marginBottom: 28,
  },
  logoMark: {
    width: 40, height: 40, background: "#0A1F44", borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: 0.5,
  },
  logoText: {
    fontSize: 18, fontWeight: 700, color: "#0A1F44", letterSpacing: "-0.3px",
  },
  title: {
    fontSize: 24, fontWeight: 700, color: "#0D0D0D",
    letterSpacing: "-0.4px", marginBottom: 6,
  },
  subtitle: {
    fontSize: 14, color: "#718096", marginBottom: 28, lineHeight: 1.5,
  },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  footer: {
    textAlign: "center", fontSize: 12, color: "#A0AEC0", marginTop: 28,
  },
};