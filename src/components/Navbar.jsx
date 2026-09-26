import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("stayhubCurrentUser") || "null"));
      } catch {
        setUser(null);
      }
    };

    loadUser();
    window.addEventListener("storage", loadUser);
    window.addEventListener("stayhub:auth", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("stayhub:auth", loadUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("stayhubCurrentUser");
    localStorage.removeItem("stayhubRememberMe");
    window.dispatchEvent(new Event("stayhub:auth"));
    setUser(null);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo" aria-label="STAYHUB Home">
          <img
            src={logo}
            alt="STAYHUB"
            style={{ width: "150px", height: "auto", display: "block" }}
          />
        </Link>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/hotels">Hotels</Link>
          <Link to="/wishlist">Wishlist</Link>
          <a href="/#features">Features</a>
          <a href="/#about">About</a>
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <button
                type="button"
                className="login-btn"
                onClick={() => navigate("/my-account")}
                title="Open account"
              >
                👤 {user.name}
              </button>
              <button type="button" className="signup-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button type="button" className="login-btn" onClick={() => navigate("/login")}>
                Login
              </button>
              <button type="button" className="signup-btn" onClick={() => navigate("/signup")}>
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
