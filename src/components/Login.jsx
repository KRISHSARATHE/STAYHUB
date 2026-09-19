
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Demo login
    alert("Login successful!");

    navigate("/");
  };

  return (
    <div className="login-page">

      {/* HEADER */}
      <header className="login-header">
        <Link to="/" className="login-logo">
          STAYHUB
        </Link>

        <Link to="/" className="login-home">
          ← Back to Home
        </Link>
      </header>

      {/* MAIN */}
      <main className="login-container">

        <div className="login-card">

          {/* LOGO ICON */}
          <div className="login-icon">
            🏨
          </div>

          <div className="login-heading">
            <h1>Welcome Back</h1>
            <p>Login to continue your STAYHUB journey</p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit}>

            <div className="login-field">
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

            <div className="login-field">
              <div className="password-label">
                <label htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    alert("Password reset feature coming soon!")
                  }
                >
                  Forgot Password?
                </button>
              </div>

              <input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="login-submit"
            >
              Login →
            </button>

          </form>

          {/* DIVIDER */}
          <div className="login-divider">
            <span>OR</span>
          </div>

          {/* SIGNUP */}
          <p className="signup-text">
            Don't have an account?{" "}
            <Link to="/signup">
              Create Account
            </Link>
          </p>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="login-footer">
        © 2026 STAYHUB. All rights reserved.
      </footer>

    </div>
  );
}

export default Login;

