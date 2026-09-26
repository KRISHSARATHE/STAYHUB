import { useState } from "react";

const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || min));

function GuestSelector({ value, onChange, compact = false }) {
  const [open, setOpen] = useState(false);
  const data = {
    rooms: Number(value?.rooms) || 1,
    adults: Number(value?.adults) || 1,
    children: Number(value?.children) || 0,
    childAges: Array.isArray(value?.childAges) ? value.childAges : [],
  };

  const update = (key, next) => {
    let nextData = { ...data, [key]: next };
    if (key === "children") {
      const ages = Array.from({ length: next }, (_, index) => data.childAges[index] ?? 8);
      nextData.childAges = ages;
    }
    onChange(nextData);
  };

  const summary = `${data.rooms} Room${data.rooms !== 1 ? "s" : ""}, ${data.adults} Adult${data.adults !== 1 ? "s" : ""}${data.children ? `, ${data.children} Child${data.children !== 1 ? "ren" : ""}` : ""}`;

  const counter = (label, key, min, max) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "9px 0" }}>
      <span style={{ fontWeight: 600, color: "#334155" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <button type="button" onClick={() => update(key, clamp(data[key] - 1, min, max))} disabled={data[key] <= min} style={circleButton(data[key] <= min)}>−</button>
        <strong style={{ minWidth: 22, textAlign: "center" }}>{data[key]}</strong>
        <button type="button" onClick={() => update(key, clamp(data[key] + 1, min, max))} disabled={data[key] >= max} style={circleButton(data[key] >= max)}>+</button>
      </div>
    </div>
  );

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          textAlign: "left",
          border: 0,
          background: "transparent",
          padding: compact ? "8px 0" : "12px 0",
          color: "#0f172a",
          fontSize: compact ? "15px" : "14px",
          cursor: "pointer",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {summary}
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, zIndex: 50, width: 310, maxWidth: "calc(100vw - 32px)", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, boxShadow: "0 18px 45px rgba(15,23,42,.16)", padding: 16 }}>
          {counter("Rooms", "rooms", 1, 5)}
          {counter("Adults", "adults", 1, 10)}
          {counter("Children", "children", 0, 6)}
          {data.children > 0 && (
            <div style={{ borderTop: "1px solid #eef2f7", paddingTop: 10, marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#475569", marginBottom: 8 }}>Children age</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                {data.childAges.map((age, index) => (
                  <label key={index} style={{ display: "grid", gap: 5, fontSize: 12, color: "#64748b" }}>
                    Child {index + 1}
                    <select
                      value={age}
                      onChange={(e) => {
                        const ages = [...data.childAges];
                        ages[index] = Number(e.target.value);
                        onChange({ ...data, childAges: ages });
                      }}
                      style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", color: "#0f172a" }}
                    >
                      {Array.from({ length: 18 }, (_, i) => <option key={i} value={i}>{i} years</option>)}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          )}
          <button type="button" onClick={() => setOpen(false)} style={{ width: "100%", marginTop: 14, padding: "10px", border: 0, borderRadius: 9, background: "#2563eb", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}

const circleButton = (disabled) => ({
  width: 30,
  height: 30,
  borderRadius: "50%",
  border: "1px solid #cbd5e1",
  background: disabled ? "#f8fafc" : "#fff",
  color: disabled ? "#cbd5e1" : "#0f172a",
  cursor: disabled ? "not-allowed" : "pointer",
  fontSize: 18,
  lineHeight: 1,
});

export default GuestSelector;
