import { useState } from "react";

const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || min));

// Default occupancy policy: two adult-equivalent guests per standard room.
// Children aged 12+ count as adults. Younger children stay with their parent/guardian
// subject to the hotel's actual room and extra-bed policy.
const requiredRooms = (adults, ages) => Math.max(1, Math.ceil((Number(adults) + ages.filter((age) => age !== "" && Number(age) >= 12).length) / 2));

function GuestSelector({ value, onChange, compact = false }) {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const notify = (message) => setNotice(message);
  const data = {
    rooms: Number(value?.rooms) || 1,
    adults: Number(value?.adults) || 1,
    children: Number(value?.children) || 0,
    childAges: Array.isArray(value?.childAges) ? value.childAges : [],
    guestType: value?.guestType || "Family",
  };

  const update = (key, next) => {
    let nextData = { ...data, [key]: next };
    if (key === "children") {
      const ages = Array.from({ length: next }, (_, index) => data.childAges[index] ?? "");
      nextData.childAges = ages;
    }
    nextData.rooms = Math.min(nextData.adults + nextData.children, Math.max(nextData.rooms, requiredRooms(nextData.adults, nextData.childAges)));
    if (nextData.rooms > data.rooms) notify(`Rooms updated to ${nextData.rooms}. Booking price will be recalculated.`);
    onChange(nextData);
  };

  const minimumRooms = requiredRooms(data.adults, data.childAges);
  const effectiveRooms = Math.min(data.adults + data.children, Math.max(data.rooms, minimumRooms));
  const summary = `${effectiveRooms} Room${effectiveRooms !== 1 ? "s" : ""}, ${data.adults} Adult${data.adults !== 1 ? "s" : ""}${data.children ? `, ${data.children} Child${data.children !== 1 ? "ren" : ""}` : ""}`;

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

          <label style={{display:"grid", gap:5, fontSize:13, fontWeight:600, color:"#334155"}}>Travelling as
            <select value={data.guestType} onChange={(e)=>onChange({...data, guestType:e.target.value, rooms:effectiveRooms})} style={{padding:9,border:"1px solid #cbd5e1",borderRadius:8}}>
              { ["Family","Couple","Friends","Individual"].map(type=><option key={type} value={type}>{type}</option>) }
            </select>
          </label>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0"}}>
            <strong>Rooms (minimum {minimumRooms})</strong>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <button type="button" style={circleButton(effectiveRooms <= minimumRooms)} disabled={effectiveRooms <= minimumRooms} onClick={()=>update("rooms",effectiveRooms-1)}>−</button>
              <strong>{effectiveRooms}</strong>
              <button type="button" style={circleButton(effectiveRooms >= Math.min(20,data.adults+data.children))} disabled={effectiveRooms >= Math.min(20,data.adults+data.children)} onClick={()=>update("rooms",effectiveRooms+1)}>+</button>
            </div>
          </div>
          <div style={{display:"flex", gap:8, marginBottom:8}}>
            <button type="button" onClick={()=>onChange({...data,rooms:minimumRooms})} style={{flex:1,padding:9,border:"1px solid #cbd5e1",borderRadius:8,background:effectiveRooms===minimumRooms?"#dbeafe":"#fff",cursor:"pointer"}}>Shared rooms</button>
            <button type="button" onClick={()=>onChange({...data,rooms:data.adults+data.children})} style={{flex:1,padding:9,border:"1px solid #cbd5e1",borderRadius:8,background:effectiveRooms===data.adults+data.children?"#dbeafe":"#fff",cursor:"pointer"}}>1 guest per room</button>
          </div>

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
                      value={age === "" ? "" : String(age)}
                      onChange={(e) => {
                        const ages = [...data.childAges];
                        ages[index] = Number(e.target.value);
                        const updatedRooms = Math.max(effectiveRooms, requiredRooms(data.adults, ages));
                        if (updatedRooms > effectiveRooms) notify(`Child aged 12+ counts towards adult occupancy. Rooms increased to ${updatedRooms}.`);
                        onChange({ ...data, childAges: ages, rooms: updatedRooms });
                      }}
                      style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", color: "#0f172a" }}
                    >
                      <option value="" disabled>Select age</option>
                      {Array.from({ length: 18 }, (_, i) => <option key={i} value={i}>{i} years</option>)}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          )}

          {notice && <div role="status" aria-live="polite" style={{marginTop:10,padding:10,borderRadius:9,background:"#eff6ff",border:"1px solid #bfdbfe",color:"#1e40af",fontSize:12,display:"flex",gap:8,alignItems:"start"}}><span style={{flex:1}}>{notice}</span><button type="button" aria-label="Dismiss notification" onClick={()=>setNotice("")} style={{border:0,background:"transparent",cursor:"pointer",color:"#1e40af"}}>✕</button></div>}
          <button type="button" onClick={() => { if (data.childAges.some((age) => age === "")) { alert("Please select the age of every child."); return; } if(data.rooms < minimumRooms) onChange({...data, rooms:minimumRooms}); setOpen(false); setNotice(""); }} style={{ width: "100%", marginTop: 14, padding: "10px", border: 0, borderRadius: 9, background: "#2563eb", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
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
