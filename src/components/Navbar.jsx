import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/stayhub-logo.png";

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = () => {
      const savedUser = localStorage.getItem("stayhubCurrentUser");

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error("Invalid user data:", error);
          localStorage.removeItem("stayhubCurrentUser");
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    loadUser();

    window.addEventListener("storage", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("stayhubCurrentUser");
    localStorage.removeItem("stayhubRememberMe");

    setUser(null);

    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-indigo-600 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

        {/* LOGO */}
        <Link to="/" className="flex items-center">
          <img
            src={logo}
            alt="STAYHUB"
            className="h-10 w-auto"
          />
        </Link>

        {/* NAVIGATION */}
        <div className="hidden items-center gap-6 md:flex">

          <Link
            to="/"
            className="font-medium text-white hover:text-indigo-200"
          >
            Home
          </Link>

          <Link
            to="/hotels"
            className="font-medium text-white hover:text-indigo-200"
          >
            Hotels
          </Link>

          <a
            href="/#about"
            className="font-medium text-white hover:text-indigo-200"
          >
            About
          </a>

          <Link
            to="/my-bookings"
            className="font-medium text-white hover:text-indigo-200"
          >
            My Bookings
          </Link>

          {/* LOGGED IN */}
          {user ? (
            <div className="flex items-center gap-3">

              <button
                onClick={() => navigate("/my-account")}
                className="rounded-lg bg-white px-4 py-2 font-semibold text-indigo-600 hover:bg-indigo-50"
              >
                👤 {user.name}
              </button>

              <button
                onClick={handleLogout}
                className="rounded-lg border border-white px-4 py-2 font-semibold text-white hover:bg-white hover:text-indigo-600"
              >
                Logout
              </button>

            </div>
          ) : (
            /* LOGGED OUT */
            <div className="flex items-center gap-3">

              <button
                onClick={() => navigate("/login")}
                className="rounded-lg bg-white px-5 py-2 font-semibold text-indigo-600 hover:bg-indigo-50"
              >
                Login
              </button>

              <button
                onClick={() => navigate("/signup")}
                className="rounded-lg border border-white px-5 py-2 font-semibold text-white hover:bg-white hover:text-indigo-600"
              >
                Sign Up
              </button>

            </div>
          )}

        </div>

        {/* MOBILE BUTTON */}
        <button className="text-2xl text-white md:hidden">
          ☰
        </button>

      </div>
    </nav>
  );
}

export default Navbar;