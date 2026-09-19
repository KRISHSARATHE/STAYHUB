import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    alert("Account created successfully!");
    navigate("/login");
  };

  return (
    <div className="signup-page">
      <header className="signup-header">
        <Link to="/" className="signup-logo">
          🏨 STAYHUB
        </Link>

        <Link to="/" className="signup-back">
          ← Back to Home
        </Link>
      </header>

      <main className="signup-main">
        <div className="signup-card">
          <div className="signup-icon">👤</div>

          <h1 className="signup-heading">Create Account</h1>

          <p className="signup-subtitle">
            Join STAYHUB and start booking amazing stays.
          </p>

          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="signup-field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="signup-field">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="signup-field">
              <label>Mobile Number</label>
              <input
                type="tel"
                placeholder="Enter your mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength="10"
                required
              />
            </div>

            <div className="signup-form-row">
              <div className="signup-field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="signup-field">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <label className="terms-check">
              <input type="checkbox" required />
              <span>
                I agree to the Terms & Conditions and Privacy Policy.
              </span>
            </label>

            <button type="submit" className="signup-submit">
              Create Account
            </button>
          </form>

          <div className="signup-divider">
            <span>OR</span>
          </div>

          <p className="login-text">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </main>

      <footer className="signup-footer">
        © 2026 STAYHUB. All rights reserved.
      </footer>
    </div>
  );
}
