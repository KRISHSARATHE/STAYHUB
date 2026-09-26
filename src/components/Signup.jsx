import { Link } from "react-router-dom";
import { useState } from "react";
import logo from "../assets/logo.svg";
import { setCurrentUser } from "../utils/stayhub";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  // ================= PASSWORD STRENGTH =================

  const getPasswordStrength = (password) => {
    if (!password) return "";

    let score = 0;

    if (password.length >= 6) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return "Weak";
    if (score <= 3) return "Medium";
    return "Strong";
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // ================= INPUT CHANGE =================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ================= SIGNUP =================

  const handleSignup = (e) => {
    e.preventDefault();

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const mobile = formData.mobile.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (
      !name ||
      !email ||
      !mobile ||
      !password ||
      !confirmPassword
    ) {
      alert("Please fill all fields.");
      return;
    }

    if (name.length < 3) {
      alert("Please enter a valid full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      alert("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (!agree) {
      alert("Please agree to the Terms & Conditions.");
      return;
    }

    setLoading(true);

    try {
      const existingUsers =
        JSON.parse(localStorage.getItem("stayhubUsers")) || [];

      const emailExists = existingUsers.some(
        (user) => user.email?.toLowerCase() === email
      );

      if (emailExists) {
        alert("An account with this email already exists.");
        setLoading(false);
        return;
      }

      const mobileExists = existingUsers.some(
        (user) => user.mobile === mobile
      );

      if (mobileExists) {
        alert("An account with this mobile number already exists.");
        setLoading(false);
        return;
      }

      const newUser = {
        id: `STH${Date.now()}`,
        name,
        email,
        mobile,
        password,
        createdAt: new Date().toLocaleDateString("en-IN"),
      };

      const updatedUsers = [...existingUsers, newUser];

      localStorage.setItem(
        "stayhubUsers",
        JSON.stringify(updatedUsers)
      );

      setCurrentUser(newUser);

      localStorage.setItem("stayhubRememberMe", "true");

      alert("Account created successfully!");

      setTimeout(() => {
        window.location.href = "/";
      }, 700);
    } catch (error) {
      console.error("Signup error:", error);
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">

      {/* BACKGROUND OVERLAY */}
      <div className="signup-overlay"></div>

      {/* ================= TOP BAR ================= */}

      <header className="signup-topbar">

        <Link to="/" className="signup-logo">
          <img
            src={logo}
            alt="STAYHUB"
          />
        </Link>

        <Link
          to="/"
          className="signup-home"
        >
          ← Back to Home
        </Link>

      </header>

      {/* ================= MAIN ================= */}

      <main className="signup-main">

        <div className="signup-card">

          {/* ACCOUNT ICON */}

          <div className="account-icon">
            👤
          </div>

          {/* HEADING */}

          <div className="signup-heading">

            <h1>Create Account</h1>

            <p>
              Join STAYHUB and start your journey.
            </p>

          </div>

          {/* ================= FORM ================= */}

          <form onSubmit={handleSignup}>

            {/* FULL NAME */}

            <div className="input-group">

              <label htmlFor="signup-name">
                Full Name
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  👤
                </span>

                <input
                  id="signup-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                />

              </div>

            </div>

            {/* EMAIL */}

            <div className="input-group">

              <label htmlFor="signup-email">
                Email Address
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  ✉️
                </span>

                <input
                  id="signup-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                />

              </div>

            </div>

            {/* MOBILE */}

            <div className="input-group">

              <label htmlFor="signup-mobile">
                Mobile Number
              </label>

              <div className="input-wrapper">

                <span className="country-code">
                  🇮🇳 +91
                </span>

                <input
                  id="signup-mobile"
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                  maxLength={10}
                  inputMode="numeric"
                  autoComplete="tel"
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div className="input-group">

              <label htmlFor="signup-password">
                Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="show-btn"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

              {passwordStrength && (
                <div className="password-strength">

                  <div
                    className={`strength-bar ${passwordStrength.toLowerCase()}`}
                  ></div>

                  <span>
                    {passwordStrength} password
                  </span>

                </div>
              )}

            </div>

            {/* CONFIRM PASSWORD */}

            <div className="input-group">

              <label htmlFor="signup-confirm-password">
                Confirm Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  🔐
                </span>

                <input
                  id="signup-confirm-password"
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="show-btn"
                  onClick={() =>
                    setShowConfirm((prev) => !prev)
                  }
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>

              </div>

              {formData.confirmPassword && (
                <div
                  className={
                    formData.password === formData.confirmPassword
                      ? "match-text success"
                      : "match-text error"
                  }
                >
                  {formData.password === formData.confirmPassword
                    ? "✓ Passwords match"
                    : "✕ Passwords do not match"}
                </div>
              )}

            </div>

            {/* TERMS */}

            <label className="terms">

              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />

              <span>
                I agree to STAYHUB's{" "}
                <b>Terms & Conditions</b>{" "}
                and Privacy Policy.
              </span>

            </label>

            {/* CREATE ACCOUNT */}

            <button
              type="submit"
              className="create-account-btn"
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : "Create Account →"}
            </button>

          </form>

          {/* LOGIN */}

          <div className="login-link">

            Already have an account?{" "}

            <Link to="/login">
              Login
            </Link>

          </div>

          {/* SECURITY */}

          <div className="secure-note">
            🔒 Your information is securely stored
          </div>

        </div>

      </main>

    </div>
  );
}

export default Signup;