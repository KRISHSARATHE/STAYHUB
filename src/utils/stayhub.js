export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem("stayhubCurrentUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setCurrentUser = (user) => {
  localStorage.setItem("stayhubCurrentUser", JSON.stringify(user));
  window.dispatchEvent(new Event("stayhub-auth-change"));
};

export const clearCurrentUser = () => {
  localStorage.removeItem("stayhubCurrentUser");
  localStorage.removeItem("stayhubRememberMe");
  window.dispatchEvent(new Event("stayhub-auth-change"));
};

export const getWishlists = () => {
  try {
    return JSON.parse(localStorage.getItem("stayhubWishlists") || "{}");
  } catch {
    return {};
  }
};

export const getWishlistKey = (user) => user?.email?.trim().toLowerCase() || user?.id || "guest";

export const getUserWishlist = (user = getCurrentUser()) => {
  const all = getWishlists();
  const saved = all[getWishlistKey(user)];
  return Array.isArray(saved) ? saved.map(Number) : [];
};

export const toggleWishlist = (user, hotelId) => {
  const all = getWishlists();
  const key = getWishlistKey(user);
  const id = Number(hotelId);
  const current = Array.isArray(all[key]) ? all[key].map(Number) : [];
  all[key] = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  localStorage.setItem("stayhubWishlists", JSON.stringify(all));
  window.dispatchEvent(new Event("stayhub-wishlist-change"));
  return all[key];
};

export const getBookings = () => {
  try {
    const raw = localStorage.getItem("stayhubBookings");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveBookings = (bookings) => {
  localStorage.setItem("stayhubBookings", JSON.stringify(bookings));
};

export const normalizeCity = (value = "") => String(value).trim().toLowerCase().replace(/\s+/g, " ");
export const getCity = (location = "") => String(location).split(",")[0].trim();

export const getMinDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const tomorrowInput = (dateString = getMinDate()) => {
  const d = new Date(`${dateString}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  const nights = Math.round((end - start) / 86400000);
  return nights > 0 ? nights : 0;
};

export const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatMoney = (value) => Number(value || 0).toLocaleString("en-IN");

export const validateGuestSelection = ({ rooms, adults, children, childAges = [] }) => {
  const roomCount = Number(rooms);
  const adultCount = Number(adults);
  const childCount = Number(children);
  if (!Number.isInteger(roomCount) || roomCount < 1) return "Select at least 1 room.";
  if (!Number.isInteger(adultCount) || adultCount < 1) return "At least 1 adult is required.";
  if (!Number.isInteger(childCount) || childCount < 0) return "Children cannot be negative.";
  if (childAges.length !== childCount) return "Please enter the age for every child.";
  if (childAges.some((age) => age === "" || !Number.isInteger(Number(age)) || Number(age) < 0 || Number(age) > 17)) return "Child age must be between 0 and 17 years.";
  const minimumRooms = Math.max(1, Math.ceil((adultCount + childAges.filter((age) => Number(age) >= 12).length) / 2));
  if (roomCount < minimumRooms) return `At least ${minimumRooms} rooms required for this guest group.`;
  if (adultCount + childCount < roomCount) return "Each room needs at least one guest.";
  return "";
};

const esc = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

export const buildInvoiceHtml = (booking) => `<!doctype html>
<html><head><meta charset="utf-8"><title>STAYHUB Booking Bill ${esc(booking.id)}</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#172033;padding:32px}.toolbar{max-width:900px;margin:0 auto 14px;display:flex;justify-content:flex-end;gap:10px}.toolbar button{border:0;border-radius:9px;padding:10px 15px;font-weight:700;cursor:pointer}.print{background:#2563eb;color:#fff}.invoice{max-width:900px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;box-shadow:0 18px 50px rgba(15,23,42,.12);border-radius:18px;overflow:hidden}.header{padding:30px 32px;background:linear-gradient(135deg,#0f172a,#1d4ed8);color:#fff;display:flex;justify-content:space-between;gap:24px;align-items:flex-start}.brand{font-size:31px;font-weight:900;letter-spacing:.3px}.sub{margin-top:6px;color:#dbeafe;font-size:13px}.status{background:#dcfce7;color:#166534;padding:8px 12px;border-radius:999px;font-size:12px;font-weight:800;display:inline-block}.meta{text-align:right;font-size:12px;line-height:1.55}.body{padding:30px 32px}.section-title{font-size:12px;letter-spacing:1px;font-weight:900;color:#64748b;margin:0 0 11px}.cards{display:grid;grid-template-columns:1fr 1fr;gap:16px}.card{border:1px solid #e2e8f0;border-radius:13px;padding:17px}.name{font-size:18px;font-weight:800}.muted{color:#64748b;font-size:13px;margin-top:5px}.staygrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.stayitem{border:1px solid #e2e8f0;border-radius:11px;padding:14px}.label{display:block;font-size:10px;letter-spacing:.8px;color:#64748b;font-weight:800;margin-bottom:5px}.value{font-size:14px;font-weight:800}.section{margin-top:24px}.rows{border:1px solid #e2e8f0;border-radius:13px;padding:8px 17px}.row{display:flex;justify-content:space-between;gap:20px;padding:12px 0;border-bottom:1px solid #eef2f7;font-size:14px}.row:last-child{border-bottom:0}.total{display:flex;justify-content:space-between;align-items:center;margin-top:13px;padding:17px 19px;background:#eff6ff;border-radius:13px}.total span{font-weight:800}.total strong{font-size:24px;color:#2563eb}.foot{border-top:1px solid #e5e7eb;margin-top:27px;padding-top:18px;color:#64748b;font-size:11px;text-align:center;line-height:1.6}.small{font-size:11px;color:#64748b}.screen-only{display:block}@media(max-width:650px){body{padding:10px}.header,.body{padding:20px}.cards{grid-template-columns:1fr}.staygrid{grid-template-columns:1fr 1fr}.header{flex-wrap:wrap}.meta{text-align:left}.toolbar{justify-content:stretch}.toolbar button{flex:1}}@media print{body{padding:0;background:#fff}.toolbar{display:none}.invoice{border:0;box-shadow:none;border-radius:0;max-width:none}}
</style></head><body>
<div class="toolbar"><button class="print" onclick="window.print()">Download / Save PDF</button></div>
<div class="invoice"><div class="header"><div><div class="brand">STAYHUB</div><div class="sub">Demo Booking Invoice</div></div><div class="meta"><div>BOOKING ID</div><strong>${esc(booking.id)}</strong><div style="margin-top:7px">ISSUED ${esc(formatDate(booking.bookedAt || new Date().toISOString()))}</div><div style="margin-top:9px"><span class="status">${esc(booking.status || "Confirmed")}</span></div></div></div>
<div class="body"><div class="cards"><div class="card"><div class="section-title">GUEST INFORMATION</div><div class="name">${esc(booking.name || "Guest")}</div><div class="muted">${esc(booking.email || "")}</div><div class="muted">${esc(booking.phone || "")}</div></div><div class="card"><div class="section-title">PROPERTY</div><div class="name">${esc(booking.hotelName || "STAYHUB Hotel")}</div><div class="muted">📍 ${esc(booking.location || "")}</div><div class="muted">${esc(booking.room || "Deluxe Room")}</div></div></div>
<div class="section"><div class="section-title">STAY DETAILS</div><div class="staygrid"><div class="stayitem"><span class="label">CHECK-IN</span><span class="value">${esc(formatDate(booking.checkIn))}</span></div><div class="stayitem"><span class="label">CHECK-OUT</span><span class="value">${esc(formatDate(booking.checkOut))}</span></div><div class="stayitem"><span class="label">ROOMS</span><span class="value">${Number(booking.rooms || 1)}</span></div><div class="stayitem"><span class="label">NIGHTS</span><span class="value">${Number(booking.nights || 0)}</span></div></div></div>
<div class="section"><div class="section-title">GUEST SUMMARY</div><div class="rows"><div class="row"><span>Travelling as</span><strong>${esc(booking.guestType || "Family")}</strong></div><div class="row"><span>Adults</span><strong>${Number(booking.adults ?? booking.guests ?? 1)}</strong></div><div class="row"><span>Children</span><strong>${Number(booking.children || 0)}</strong></div>${(booking.childAges || []).map((age, i) => `<div class="row"><span>Child ${i + 1} age</span><strong>${Number(age)} years</strong></div>`).join("")}</div></div>
<div class="section"><div class="section-title">CHARGES</div><div class="rows"><div class="row"><span>Room charges</span><strong>₹${formatMoney(booking.roomAmount ?? booking.total ?? booking.price)}</strong></div><div class="row"><span>Extra beds (${Number(booking.extraBeds || 0)} × ₹800 × ${Number(booking.nights || 0)} nights)</span><strong>₹${formatMoney(booking.extraBedAmount || 0)}</strong></div><div class="row"><span>Service fee</span><strong>₹${formatMoney(booking.serviceFee || 0)}</strong></div><div class="row"><span>GST / taxes</span><strong>₹${formatMoney(booking.tax || 0)}</strong></div><div class="total"><span>Grand Total</span><strong>₹${formatMoney(booking.total ?? booking.price)}</strong></div></div></div>
<div class="foot">Thank you for choosing STAYHUB.<br>DEMO ONLY — This document is for academic demonstration. No real hotel reservation or payment is confirmed.</div></div></div></body></html>`;

export const openInvoice = (booking) => {
  const popup = window.open("", "_blank", "width=980,height=900");
  if (!popup) {
    alert("Please allow pop-ups to download your booking bill.");
    return;
  }
  popup.document.open();
  popup.document.write(buildInvoiceHtml(booking));
  popup.document.close();
};
