import logo from "../assets/logo.svg";
function Navbar() {
  return (
<nav className="sticky top-0 z-50 bg-indigo-600 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        
        {/* Logo */}
<a href="/" className="flex items-center">
  <img
    src={logo}
    alt="STAYHUB"
    className="h-10 w-auto"
  />
</a>

        {/* Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="/"
            className="font-medium text-gray-700 hover:text-indigo-600"
          >
            Home
          </a>

          <a
            href="/hotels"
            className="font-medium text-gray-700 hover:text-indigo-600"
          >
            Hotels
          </a>

          <a
            href="#about"
            className="font-medium text-gray-700 hover:text-indigo-600"
          >
            About
          </a>

          <button className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700">
            Login
          </button>
        </div>

        {/* Mobile Button */}
        <button className="text-2xl text-gray-700 md:hidden">
          ☰
        </button>
      </div>
    </nav>
  );
}

export default Navbar;