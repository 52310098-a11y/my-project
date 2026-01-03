import React from "react";
import { NavLink } from "react-router-dom";

const handleLogout = () => {
  // Clear any stored session data (if applicable)
  localStorage.removeItem("portal_session");
  localStorage.removeItem("isLoggedIn");
  // Redirect to login page
  window.location.href = "/login";
};

const linkStyle = ({ isActive }) => ({
  padding: "8px 12px",
  borderRadius: 12,
  textDecoration: "none",
  fontWeight: 800,
  color: isActive ? "#0f172a" : "white",
  background: isActive ? "#38bdf8" : "transparent",
  border: "1px solid #334155",
});
const logoutStyle = ({ isActive }) => ({
  padding: "8px 12px",
  borderRadius: 12,
  textDecoration: "none",
  fontWeight: 800,
  color: "white",
  background: "#dc2626", // red
  border: "1px solid #b91c1c",
});

export default function Navbar() {
  return (
    <header style={{ background: "#0f172a", position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 12, display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "#334155", display: "grid", placeItems: "center", fontWeight: 900, color: "white" }}>
            SP
          </div>
          <div style={{ color: "white", lineHeight: 1.1 }}>
            <div style={{ fontWeight: 900 }}>Student Portal</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>React + Router (frontend)</div>
          </div>
        </div>

        <nav style={{ display: "flex", gap: 10 }}>
          <NavLink to="/students" style={linkStyle}>Students</NavLink>
          <NavLink to="/teacher" style={linkStyle}>Teacher</NavLink>
          <NavLink to="/admin" style={linkStyle}>Admin</NavLink>
          <NavLink to="/login" style={logoutStyle} onClick={handleLogout}>Logout</NavLink>
        </nav>
      </div>
    </header>
  );
}
