import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
const logo = "/stayhub-logo.svg";
import { setCurrentUser } from "../utils/stayhub";
import { apiRequest } from "../utils/api";

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
        callback: async (response) => {
          try {
            setError("");
            const result = await apiRequest("/auth/google", {
              method: "POST",
              body: JSON.stringify({ credential: response.credential }),
            });
            if (!result?.data || !result?.token) {
              throw new Error("Google sign-in response was incomplete.");
            }
            localStorage.setItem("stayhubToken", result.token);
            setCurrentUser({
              ...result.data,
              mobile: result.data.phone || "",
              google: true,
              emailVerified: true,
            });
            setSuccess(`Welcome, ${result.data.name}!`);
            window.location.href = "/";
          } catch (error) {
            setError(error.message || "Google sign-in failed. Please try again.");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });

      if (!result?.data || !result?.token) {
        throw new Error("Login response was incomplete.");
      }

      localStorage.setItem("stayhubToken", result.token);
      setCurrentUser({
        ...result.data,
        mobile: result.data.phone || result.data.mobile || "",
        emailVerified: true,
      });

      if (rememberMe) {
        localStorage.setItem("stayhubRememberMe", "true");
      } else {
        localStorage.removeItem("stayhubRememberMe");
      }

      setSuccess(`Welcome back, ${result.data.name}!`);
      setTimeout(() => { window.location.href = "/"; }, 700);
    } catch (error) {
      setError(error.message || "Login failed. Please try again.");
    }
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

                <Link to="/forgot-password">Forgot Password?</Link>
                

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