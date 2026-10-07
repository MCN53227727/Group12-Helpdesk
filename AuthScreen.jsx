import { useState } from "react";
import { useAuth } from "../lib/AuthContext";

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("sign_in"); // 'sign_in' | 'sign_up'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState(null);
  const [note, setNote] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setNote(null);
    setBusy(true);
    const result =
      mode === "sign_in"
        ? await signIn({ email, password })
        : await signUp({ email, password, fullName });
    setBusy(false);
    if (result.error) {
      setError(result.error.message);
    } else if (mode === "sign_up") {
      setNote("Account created. Check your email to confirm, then sign in.");
      setMode("sign_in");
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1>NWU Helpdesk Ticketing System</h1>
        <p className="sub">
          {mode === "sign_in" ? "Sign in to your queue." : "Create an account to raise tickets."}
        </p>

        {error && <div className="form-error">{error}</div>}
        {note && <div className="form-note">{note}</div>}

        <form onSubmit={handleSubmit}>
          {mode === "sign_up" && (
            <div className="field">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Working…" : mode === "sign_in" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="auth-toggle">
          {mode === "sign_in" ? (
            <>
              New here?{" "}
              <button type="button" onClick={() => setMode("sign_up")}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => setMode("sign_in")}>
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
