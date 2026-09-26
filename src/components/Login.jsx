import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import logo from "../assets/logo.svg";
import { setCurrentUser } from "../utils/stayhub";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;
    const renderGoogle = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          try {
            const payload = JSON.parse(atob(response.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
            const user = { id: payload.sub, name: payload.name || payload.email?.split("@")[0] || "Google User", email: payload.email || "", picture: payload.picture || "", mobile: "", google: true, emailVerified: true, createdAt: new Date().toISOString() };
            const users = JSON.parse(localStorage.getItem("stayhubUsers") || "[]");
            if (!users.some((item) => item.email?.toLowerCase() === user.email.toLowerCase())) { localStorage.setItem("stayhubUsers", JSON.stringify([...users, user])); }
            setCurrentUser(user);
            setSuccess(`Welcome back, ${user.name}!`);
            setTimeout(() => { window.location.href = "/"; }, 500);
          } catch {
            setError("Google sign-in could not be completed. Please try again.");
          }
        },
      });
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, { theme: "outline", size: "large", width: 360, text: "continue_with" });
    };
    if (window.google?.accounts?.id) renderGoogle();
    else {
      const existing = document.getElementById("google-gsi-script");
      if (existing) existing.addEventListener("load", renderGoogle, { once: true });
      else {
        const script = document.createElement("script");
        script.id = "google-gsi-script";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true; script.defer = true; script.onload = renderGoogle;
        document.head.appendChild(script);
      }
    }
    return () => { if (googleButtonRef.current) googleButtonRef.current.innerHTML = ""; };
  }, [googleClientId]);

  const handleGoogleClick = () => {
    if (!googleClientId) setError("Google Login needs VITE_GOOGLE_CLIENT_ID in your .env file.");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const users =
      JSON.parse(localStorage.getItem("stayhubUsers")) || [];

    const user = users.find(
      (item) =>
        item.email?.toLowerCase() ===
          formData.email.trim().toLowerCase() &&
        item.password === formData.password
    );

    if (!user) {
      setError("Invalid email or password.");
      return;
    }

    // Save logged-in user
    setCurrentUser(user);

    // Remember me
    if (rememberMe) {
      localStorage.setItem(
        "stayhubRememberMe",
        "true"
      );
    } else {
      localStorage.removeItem("stayhubRememberMe");
    }

    setSuccess(`Welcome back, ${user.name}!`);

    // Reload Home so Navbar detects logged-in user
    setTimeout(() => {
      window.location.href = "/";
    }, 700);
  };

  return (
    <div className="login-page">

      {/* BACKGROUND */}
      <div className="login-background"></div>
      <div className="login-overlay"></div>

      {/* HEADER */}
      <header className="login-topbar">

        <Link to="/" className="login-brand">
          <img
            src={logo}
            alt="STAYHUB"
          />
        </Link>

        <Link
          to="/"
          className="login-back"
        >
          ← Back to Home
        </Link>

      </header>

      {/* MAIN */}
      <main className="login-wrapper">

        <div className="login-card">

          {/* ICON */}
          <div className="login-logo-circle">
            <span>🔐</span>
          </div>

          {/* TITLE */}
          <div className="login-title">

            <h1>Welcome Back</h1>

            <p>
              Login to continue your STAYHUB journey.
            </p>

          </div>

          {/* ERROR */}
          {error && (
            <div className="login-error">
              ❌ {error}
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="login-success">
              ✅ {success}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit}>

            {/* EMAIL */}
            <div className="login-input-group">

              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />

            </div>

            {/* PASSWORD */}
            <div className="login-input-group">

              <div className="login-password-label">

                <label htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "Password reset feature will be connected later."
                    )
                  }
                >
                  Forgot Password?
                </button>

              </div>

              <div className="login-password">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

            </div>

            {/* REMEMBER ME */}
            <label className="login-remember">

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(e.target.checked)
                }
              />

              <span>Remember me</span>

            </label>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="login-submit-btn"
            >
              Login to STAYHUB →
            </button>

          </form>

          {/* DIVIDER */}
          <div className="login-divider">
            <span>OR</span>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "18px" }}>
            {googleClientId ? (
              <div ref={googleButtonRef}></div>
            ) : (
              <button type="button" onClick={handleGoogleClick} style={{ width: "100%", padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", background: "#fff", color: "#334155", fontWeight: 700, cursor: "pointer" }}>Continue with Google</button>
            )}
          </div>

          {/* SIGNUP */}
          <div className="login-signup-text">

            <span>
              Don't have an account?
            </span>

            <Link to="/signup">
              Create Account
            </Link>

          </div>

        </div>

      </main>

    </div>
  );
}

export default Login;