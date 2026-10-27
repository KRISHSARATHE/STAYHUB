import { safeHotelImage, handleHotelImageError } from "../utils/hotelImage.js";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
const stayhubLogo = "/stayhub-logo.svg";
import { getCurrentUser } from "../utils/stayhub";
import { apiRequest } from "../utils/api";

function Wishlist() {
  const user = getCurrentUser();
  const [savedHotels, setSavedHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWishlist() {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const email = encodeURIComponent(user.email);
        const result = await apiRequest(`/wishlist?email=${email}`);
        setSavedHotels(result.data || []);
      } catch (error) {
        console.error("Failed to load wishlist:", error);
        setSavedHotels([]);
      } finally {
        setLoading(false);
      }
    }

    loadWishlist();

    const refresh = () => loadWishlist();
    window.addEventListener("stayhub-wishlist-change", refresh);

    return () =>
      window.removeEventListener("stayhub-wishlist-change", refresh);
  }, [user?.email]);

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <header className="details-topbar"><Link to="/"><img src={stayhubLogo} alt="STAYHUB" style={{ height: 42 }} /></Link><Link to="/" className="back-button">← Back to Home</Link></header>
        <main style={{ maxWidth: 900, margin: "0 auto", padding: "70px 20px", textAlign: "center" }}>
          <h1>Wishlist</h1><p style={{ color: "#64748b", marginBottom: 24 }}>Please login to save and view your favourite hotels.</p>
          <Link to="/login" style={{ display: "inline-block", background: "#4f46e5", color: "#fff", textDecoration: "none", padding: "12px 22px", borderRadius: 10, fontWeight: 700 }}>Login to Continue</Link>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
        <header className="details-topbar">
          <Link to="/">
            <img src={stayhubLogo} alt="STAYHUB" style={{ height: 42 }} />
          </Link>
          <Link to="/hotels" className="back-button">← Back to Hotels</Link>
        </header>

        <main style={{ maxWidth: 900, margin: "0 auto", padding: "70px 20px", textAlign: "center" }}>
          <h1>Loading Wishlist...</h1>
          <p style={{ color: "#64748b" }}>Fetching your saved hotels.</p>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <header className="details-topbar"><Link to="/"><img src={stayhubLogo} alt="STAYHUB" style={{ height: 42 }} /></Link><Link to="/hotels" className="back-button">← Back to Hotels</Link></header>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "35px 20px 60px" }}>
        <div style={{ marginBottom: 24 }}><p style={{ color: "#4f46e5", fontWeight: 800, letterSpacing: 1.2, margin: 0 }}>SAVED STAYS</p><h1 style={{ margin: "7px 0" }}>My Wishlist</h1><p style={{ color: "#64748b" }}>{savedHotels.length} saved hotel{savedHotels.length !== 1 ? "s" : ""}</p></div>
        {!savedHotels.length ? (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: "65px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>♡</div><h2>No saved hotels yet</h2><p style={{ color: "#64748b", marginBottom: 22 }}>Save hotels from the listings or hotel details page.</p><Link to="/hotels" style={{ display: "inline-block", background: "#4f46e5", color: "#fff", textDecoration: "none", padding: "12px 20px", borderRadius: 10, fontWeight: 700 }}>Explore Hotels</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 24 }}>
            {savedHotels.map((hotel) => (
              <div key={hotel.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, overflow: "hidden", boxShadow: "0 8px 25px rgba(15,23,42,.07)" }}>
                <div style={{ position: "relative", height: 210 }}><img src={safeHotelImage(hotel.image)} onError={handleHotelImageError} alt={hotel.name} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} /><button type="button" onClick={async () => {
                        try {
                          await apiRequest(`/wishlist/${hotel.id}?email=${encodeURIComponent(user.email)}`, {
                            method: "DELETE",
                          });

                          setSavedHotels((prev) =>
                            prev.filter((item) => Number(item.id) !== Number(hotel.id))
                          );

                          window.dispatchEvent(new Event("stayhub-wishlist-change"));
                        } catch (error) {
                          console.error("Wishlist removal failed:", error);
                          alert(error.message || "Could not remove hotel from wishlist.");
                        }
                      }} style={{ position: "absolute", top: 12, right: 12, width: 40, height: 40, borderRadius: "50%", border: 0, background: "#fff", cursor: "pointer", fontSize: 21 }} aria-label="Remove from wishlist">♥</button></div>
                <div style={{ padding: 18 }}><div style={{ color: "#64748b", fontSize: 14, marginBottom: 7 }}>📍 {hotel.location}</div><h2 style={{ margin: "0 0 12px", fontSize: 20 }}>{hotel.name}</h2><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12 }}><div><small style={{ color: "#64748b" }}>Starting from</small><div style={{ fontWeight: 800, fontSize: 21 }}>₹{hotel.price.toLocaleString("en-IN")}</div><small style={{ color: "#64748b" }}>per night</small></div><Link to={`/hotels/${hotel.id}`} style={{ background: "#4f46e5", color: "#fff", textDecoration: "none", padding: "11px 15px", borderRadius: 10, fontWeight: 700 }}>View Details</Link></div></div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Wishlist;
