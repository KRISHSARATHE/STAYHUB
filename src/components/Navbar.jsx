import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* STAYHUB LOGO */}
        <Link to="/" className="flex items-center">
          <img
            src={logo}
            alt="STAYHUB"
            className="h-12 w-auto object-contain"
          />
        </Link>

        {/* NAVIGATION */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className="text-gray-700 font-semibold hover:text-blue-600 transition"
          >
            Home
          </Link>

          <Link
            to="/hotels"
            className="text-gray-700 font-semibold hover:text-blue-600 transition"
          >
            Hotels
          </Link>

          <a
            href="#features"
            className="text-gray-700 font-semibold hover:text-blue-600 transition"
          >
            Features
          </a>

          <a
            href="#about"
            className="text-gray-700 font-semibold hover:text-blue-600 transition"
          >
            About
          </a>
        </div>

        {/* BUTTONS */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-5 py-2 rounded-lg border-2 border-blue-500 text-blue-600 font-semibold hover:bg-blue-50 transition"
          >
            Login
          </Link>

          <Link
            to="/signup"
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Sign Up
          </Link>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;