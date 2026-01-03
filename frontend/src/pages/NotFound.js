import React from "react";

export default function NotFound() {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 16,
      }}
    >
      <div style={{ fontWeight: 900, marginBottom: 8 }}>Page not found</div>
      <div style={{ color: "#64748b" }}>Use the navbar to navigate.</div>
    </div>
  );
}
