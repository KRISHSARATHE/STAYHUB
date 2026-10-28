import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
const logo = "/stayhub-logo.svg";
import { apiRequest } from "../utils/api";


export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const result = await apiRequest("/auth/admin/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      localStorage.setItem(
        "stayhubAdminSession",
        JSON.stringify({
          ...(result.data || {}),
          token: result.token,
          signedInAt: new Date().toISOString(),
        })
      );

      navigate("/admin", { replace: true });
    } catch (error) {
      setError(error.message || "Invalid admin email or password.");
    }
  };

  return (
    <div className="login-page admin-login-page">
      <div className="login-background"></div>
      <div className="login-overlay"></div>
      <header className="login-topbar">
        <Link to="/" className="login-brand"><img src={logo} alt="STAYHUB" /></Link>
        <Link to="/" className="login-back">← Back to Home</Link>
      </header>
      <div className="login-wrapper">
        <div className="login-card admin-login-card">
          <div className="login-logo-circle"><span>🛡️</span></div>
          <div className="login-title">
            <h1>Admin Login</h1>
            <p>Manage your STAYHUB platform.</p>
          </div>

          {error && <div className="admin-alert admin-alert-error">{error}</div>}

          <form onSubmit={submit} className="login-form admin-login-form">
            <div className="login-input-group"><label htmlFor="admin-email">Email Address</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                required
              />
            </div>
            <div className="login-input-group"><label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>
            <button className="login-submit" type="submit">Login to STAYHUB Admin →</button>
          </form>

          <Link to="/" className="admin-back-link">← Back to STAYHUB</Link>
        </div>
      </div>
    </div>
  );
}
