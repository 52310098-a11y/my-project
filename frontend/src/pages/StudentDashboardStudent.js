import React, { useEffect, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";

const API = "";

const handleLogout = () => {
  localStorage.removeItem("portal_session");
  localStorage.removeItem("isLoggedIn");
  window.location.href = "/login";
};

const logoutStyle = () => ({
  padding: "8px 12px",
  borderRadius: 12,
  textDecoration: "none",
  fontWeight: 800,
  color: "white",
  background: "#dc2626",
  border: "1px solid #b91c1c",
});

const containerStyle = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "16px 12px",
  display: "grid",
  gap: 16,
};

// ✅ Extract numeric student id from session email like: "5@students.liu.edu"
const getLoggedStudentId = () => {
  try {
    const session = JSON.parse(
      localStorage.getItem("portal_session") || "null"
    );
    const email =
      session?.email || session?.username || session?.studentEmail || "";
    const left = String(email).split("@")[0];
    const id = left.replace(/\D/g, "");
    return id || "";
  } catch {
    return "";
  }
};

function Card({ title, children }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 16,
      }}
    >
      <div style={{ fontWeight: 900, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function AbsenceMeter({ used, allowed }) {
  const safeAllowed = Math.max(0, allowed);
  const safeUsed = Math.max(0, Math.min(used, safeAllowed));
  const pct =
    safeAllowed === 0 ? 100 : Math.round((safeUsed / safeAllowed) * 100);

  return (
    <div style={{ marginTop: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "#64748b",
        }}
      >
        <span>Absences</span>
        <span>
          {safeUsed}/{safeAllowed} ({pct}%)
        </span>
      </div>
      <div
        style={{
          height: 10,
          background: "#e2e8f0",
          borderRadius: 999,
          overflow: "hidden",
          marginTop: 6,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: pct >= 100 ? "#ef4444" : "#38bdf8",
          }}
        />
      </div>
    </div>
  );
}

export default function StudentDashboardStudent() {
  const [studentId] = useState(getLoggedStudentId()); // no switching
  const [rows, setRows] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        if (!studentId) {
          setError("No student ID found in session. Please login again.");
          setRows([]);
          setStudent(null);
          return;
        }

        // ✅ Uses your backend: GET /students/:id/dashboard
        const res = await axios.get(`${API}/students/${studentId}/dashboard`);
        setStudent(res.data?.student || null);
        setRows(Array.isArray(res.data?.rows) ? res.data.rows : []);
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load dashboard.");
        setRows([]);
        setStudent(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <header
        style={{
          background: "#0f172a",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: 12,
            display: "flex",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "#334155",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                color: "white",
              }}
            >
              SP
            </div>
            <div style={{ color: "white", lineHeight: 1.1 }}>
              <div style={{ fontWeight: 900 }}>Student Portal</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                React + Router (frontend)
              </div>
            </div>
          </div>

          <nav style={{ display: "flex", gap: 10 }} onClick={handleLogout}>
            <NavLink to="/login" style={logoutStyle}>
              Logout
            </NavLink>
          </nav>
        </div>
      </header>

      <main style={containerStyle}>
        <Card title="My Dashboard">
          {loading ? (
            <div style={{ color: "#64748b", fontSize: 14 }}>Loading...</div>
          ) : error ? (
            <div
              style={{
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#991b1b",
                padding: 12,
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Student</div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>
                  {student ? `${student.Fname} ${student.Lname}` : "—"}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  ID: <b>{studentId}</b>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 6,
                  minWidth: 220,
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: 12,
                  background: "#f8fafc",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: 13, color: "#64748b" }}>
                    Courses
                  </span>
                  <b>{rows.length}</b>
                </div>

                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: 13, color: "#64748b" }}>
                    Average grade
                  </span>
                  <b>
                    {(() => {
                      const grades = rows
                        .map((r) => r.grade)
                        .filter((g) => g != null);
                      if (!grades.length) return "—";
                      const avg =
                        grades.reduce((a, b) => a + Number(b), 0) /
                        grades.length;
                      return Math.round(avg);
                    })()}
                  </b>
                </div>

                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: 13, color: "#64748b" }}>
                    Total absences
                  </span>
                  <b>
                    {rows.reduce(
                      (sum, r) => sum + Number(r.absences_used || 0),
                      0
                    )}
                  </b>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card title="My Courses">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12,
            }}
          >
            {rows.map((r) => (
              <div
                key={r.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ fontWeight: 900 }}>{r.course}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Absences left: <b>{r.absences_left}</b>
                  </div>
                </div>

                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ fontSize: 13, color: "#64748b" }}>
                      Grade
                    </span>
                    <span style={{ fontWeight: 900 }}>
                      {r.grade == null ? "—" : r.grade}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ fontSize: 13, color: "#64748b" }}>
                      Absences used
                    </span>
                    <span style={{ fontWeight: 900 }}>{r.absences_used}</span>
                  </div>
                </div>

                <AbsenceMeter
                  used={r.absences_used}
                  allowed={r.absences_allowed}
                />
              </div>
            ))}

            {!loading && !error && rows.length === 0 && (
              <div style={{ color: "#64748b", fontSize: 14 }}>
                No courses found for this student.
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
