import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
const logo = "/stayhub-logo.svg";
import { apiRequest } from "../utils/api";

export default function PasswordRecovery() {
  const reset = useLocation().pathname === "/reset-password";
  const resend = useLocation().pathname === "/resend-verification";
  const token = new URLSearchParams(useLocation().search).get("token") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [devLink, setDevLink] = useState("");
  async function submit(event) {
    event.preventDefault(); setError(""); setMessage(""); setDevLink("");
    if (reset && password !== confirm) { setError("Passwords do not match."); return; }
    if (reset && (!token || password.length < 8)) { setError("Valid reset link and at least 8 characters required."); return; }
    setBusy(true);
    try {
      const result = await apiRequest(reset ? "/auth/reset-password" : resend ? "/auth/resend-verification" : "/auth/forgot-password", {
        method: "POST", body: JSON.stringify(reset ? { token, password } : { email })
      });
      setMessage(result.message || "Request completed.");
      if (result.devResetUrl) setDevLink(result.devResetUrl);
    } catch (e) { setError(e.message || "Request failed."); }
    finally { setBusy(false); }
  }
  return <div className="login-page">
    <div className="login-background"/><div className="login-overlay"/>
    <header className="login-topbar"><Link to="/" className="login-brand"><img src={logo} alt="STAYHUB"/></Link><Link to="/login" className="login-back">← Back to Login</Link></header>
    <main className="login-wrapper"><div className="login-card">
      <div className="login-logo-circle"><span>🔐</span></div>
      <div className="login-title"><h1>{reset ? "Reset Password" : resend ? "Resend Verification" : "Forgot Password"}</h1><p>{reset ? "Choose a new password for your account." : resend ? "Enter your email to receive a new verification link." : "Enter your registered email to receive a reset link."}</p></div>
      {error && <div className="login-error">{error}</div>}
      {message && <div className="login-success">{message}</div>}
      {devLink && <p><a href={devLink}>Open development reset link</a></p>}
      <form onSubmit={submit}>
        {reset ? <><div className="login-input-group"><label htmlFor="new-password">New Password</label><input id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)}/></div>
          <div className="login-input-group"><label htmlFor="confirm-password">Confirm Password</label><input id="confirm-password" type="password" autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)}/></div></>
        : <div className="login-input-group"><label htmlFor="reset-email">Email Address</label><input id="reset-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></div>}
        <button className="login-submit-btn" type="submit" disabled={busy}>{busy ? "Please wait..." : reset ? "Reset Password" : resend ? "Resend Verification" : "Send Reset Link"}</button>
      </form><div className="login-signup-text"><Link to="/login">Back to Login</Link> {!reset && !resend && <Link to="/resend-verification">Resend Verification</Link>}</div>
    </div></main>
  </div>;
}
