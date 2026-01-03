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
  const [studentId, setStudentId] = useState("S1");
  const [rows, setRows] = useState([]);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    (async () => {
      const list = await portalApi.getStudents();
      setStudents(list);
      if (list.length && !list.find((s) => s.id === studentId)) {
        setStudentId(list[0].id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      const data = await portalApi.getStudentDashboard(studentId);
      setStudent(data.student);
      setRows(data.rows);
    })();
  }, [studentId]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card title="Student Dashboard">
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
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Selected student
            </div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>
              {student ? `${student.firstName} ${student.lastName}` : "—"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>Switch</span>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "10px 12px",
              }}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>
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
                  <span style={{ fontSize: 13, color: "#64748b" }}>Grade</span>
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
        </div>
      </Card>
    </div>
  );
}
