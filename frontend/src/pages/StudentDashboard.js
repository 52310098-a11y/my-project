import React, { useEffect, useState } from "react";
import { portalApi } from "../services/portalApi";

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

export default function StudentDashboard() {
  const [students, setStudents] = useState([]);
  const [dashboards, setDashboards] = useState({}); // { [studentId]: { student, rows } }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await portalApi.getStudents();
      setStudents(list);

      // Fetch dashboards for all students in parallel
      const results = await Promise.all(
        list.map(async (s) => {
          const data = await portalApi.getStudentDashboard(s.id);
          return [s.id, data];
        })
      );

      const map = Object.fromEntries(results);
      setDashboards(map);
    } catch (e) {
      setError("Failed to load students dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card title="Students Dashboard (All Students)">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 13, color: "#64748b" }}>
            Showing grades & absences for <b>{students.length}</b> students
          </div>

          <button
            onClick={loadAll}
            style={{
              borderRadius: 12,
              border: "1px solid #0f172a",
              background: "#0f172a",
              color: "white",
              padding: "10px 12px",
              fontWeight: 900,
              cursor: "pointer",
            }}
            type="button"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: 12,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#991b1b",
              padding: 12,
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
      </Card>

      {/* One block per student */}
      <div style={{ display: "grid", gap: 16 }}>
        {students.map((s) => {
          const data = dashboards[s.id];
          const student = data?.student || s; // fallback to list item
          const rows = data?.rows || [];

          return (
            <Card
              key={s.id}
              title={`${student.firstName ?? student.Fname ?? ""} ${
                student.lastName ?? student.Lname ?? ""
              } (ID: ${s.id})`}
            >
              {loading && !data ? (
                <div style={{ color: "#64748b", fontSize: 13 }}>Loading...</div>
              ) : (
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
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ fontSize: 13, color: "#64748b" }}>
                            Grade
                          </span>
                          <span style={{ fontWeight: 900 }}>
                            {r.grade == null ? "—" : r.grade}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ fontSize: 13, color: "#64748b" }}>
                            Absences used
                          </span>
                          <span style={{ fontWeight: 900 }}>
                            {r.absences_used}
                          </span>
                        </div>
                      </div>

                      <AbsenceMeter
                        used={r.absences_used}
                        allowed={r.absences_allowed}
                      />
                    </div>
                  ))}

                  {!rows.length && (
                    <div style={{ color: "#64748b", fontSize: 13 }}>
                      No courses found for this student.
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
