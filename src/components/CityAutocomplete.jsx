import { useMemo, useState } from "react";
import { getCity } from "../utils/stayhub";

// Offline city/state labels. Search still submits only the city name.
const CITY_STATES = [
  ["Agra","Uttar Pradesh"],["Ahmedabad","Gujarat"],["Ajmer","Rajasthan"],
  ["Amritsar","Punjab"],["Aurangabad","Maharashtra"],["Bengaluru","Karnataka"],
  ["Bhopal","Madhya Pradesh"],["Bhubaneswar","Odisha"],["Chandigarh","Chandigarh"],
  ["Chennai","Tamil Nadu"],["Coimbatore","Tamil Nadu"],["Dehradun","Uttarakhand"],
  ["Delhi","Delhi"],["Panaji","Goa"],["Gurugram","Haryana"],
  ["Guwahati","Assam"],["Gwalior","Madhya Pradesh"],["Hyderabad","Telangana"],
  ["Indore","Madhya Pradesh"],["Jaipur","Rajasthan"],["Jaisalmer","Rajasthan"],
  ["Jodhpur","Rajasthan"],["Kanpur","Uttar Pradesh"],["Kochi","Kerala"],
  ["Kolkata","West Bengal"],["Lucknow","Uttar Pradesh"],["Ludhiana","Punjab"],
  ["Manali","Himachal Pradesh"],["Mumbai","Maharashtra"],["Mysuru","Karnataka"],
  ["Nagpur","Maharashtra"],["Nashik","Maharashtra"],["Noida","Uttar Pradesh"],
  ["Patna","Bihar"],["Pune","Maharashtra"],["Raipur","Chhattisgarh"],
  ["Rajkot","Gujarat"],["Ranchi","Jharkhand"],["Rishikesh","Uttarakhand"],
  ["Shimla","Himachal Pradesh"],["Srinagar","Jammu and Kashmir"],
  ["Surat","Gujarat"],["Thane","Maharashtra"],
  ["Thiruvananthapuram","Kerala"],["Udaipur","Rajasthan"],
  ["Ujjain","Madhya Pradesh"],["Vadodara","Gujarat"],
  ["Varanasi","Uttar Pradesh"],["Visakhapatnam","Andhra Pradesh"],
  ["Dubai","United Arab Emirates"],["Singapore","Singapore"],
  ["London","United Kingdom"],["New York","New York, USA"],
  ["Bangkok","Thailand"],["Paris","France"],["Tokyo","Japan"],
  ["Sydney","New South Wales, Australia"]
];

export default function CityAutocomplete({ value, onChange, hotels = [], placeholder = "Search city", style, id }) {
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const cities = useMemo(() => {
    const unique = new Map();
    for (const [city, state] of CITY_STATES) unique.set(city.toLowerCase(), { city, state });
    for (const hotel of hotels) {
      const raw = typeof hotel.location === "string" ? hotel.location : (hotel.location?.city || hotel.city || "");
      const city = getCity(raw);
      if (city && city.length <= 60 && !/^\d+$/.test(city)) if (!unique.has(city.toLowerCase())) unique.set(city.toLowerCase(), { city, state: "" });
    }
    return [...unique.values()].sort((a, b) => a.city.localeCompare(b.city));
  }, [hotels]);
  const query = value.trim().toLowerCase();
  const suggestions = query ? cities.filter(item => `${item.city} ${item.state}`.toLowerCase().includes(query) && item.city.toLowerCase() !== query).slice(0, 7) : [];
  const show = focused && suggestions.length > 0;
  const choose = item => { onChange(item.city); setFocused(false); setActiveIndex(-1); };

  return (
    <div style={{ position: "relative", width: "100%", minWidth: 0 }}>
      <input
        id={id}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={show}
        aria-controls={show ? `${id || "city"}-suggestions` : undefined}
        placeholder={placeholder}
        value={value}
        onChange={event => { onChange(event.target.value); setActiveIndex(-1); }}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); setActiveIndex(-1); }}
        onKeyDown={event => {
          if (event.key === "Escape") { setFocused(false); setActiveIndex(-1); }
          if (!show) return;
          if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex(i => Math.min(i + 1, suggestions.length - 1)); }
          if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
          if (event.key === "Enter" && activeIndex >= 0) { event.preventDefault(); choose(suggestions[activeIndex]); }
        }}
        style={{ width: "100%", boxSizing: "border-box", ...style }}
      />
      {show && (
        <div id={`${id || "city"}-suggestions`} role="listbox" style={{
          position: "absolute", zIndex: 1000, top: "calc(100% + 5px)", left: 0, right: 0,
          maxHeight: 250, overflowY: "auto", background: "#fff", border: "1px solid #cbd5e1",
          borderRadius: 10, boxShadow: "0 10px 25px rgba(15,23,42,.15)"
        }}>
          {suggestions.map((city, index) => (
            <div key={city.city} role="option" aria-selected={index === activeIndex}
              onMouseDown={event => { event.preventDefault(); choose(city); }}
              style={{ padding: "11px 14px", cursor: "pointer", color: "#172554", fontSize: 14,
                background: index === activeIndex ? "#dbeafe" : "#fff", borderBottom: "1px solid #f1f5f9" }}>
              📍 {city.city}{city.state ? `, ${city.state}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
