import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
        <Outlet />
      </main>
    </div>
  );
}
