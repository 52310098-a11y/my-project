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

export default function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("S1");
  const [rows, setRows] = useState([]);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    (async () => {
      const list = await portalApi.getStudents();
      setStudents(list);
      if (list.length) setStudentId(list[0].id);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const data = await portalApi.getStudentDashboard(studentId);
      setRows(data.rows);
    })();
  }, [studentId]);

  const refresh = async () => {
    const data = await portalApi.getStudentDashboard(studentId);
    setRows(data.rows);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card title="Teacher Dashboard">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>Student</span>
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

          <button
            onClick={refresh}
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
          >
            Refresh
          </button>
        </div>
      </Card>

      <Card title="Courses">
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

      <Card title="Edit Grades & Absences">
        <div style={{ display: "grid", gap: 12 }}>
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
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontWeight: 900 }}>{r.course}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Absences left: <b>{r.absences_allowed - r.absences_used}</b>
                </div>
              </div>

              <div
                style={{
                  marginTop: 10,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 10,
                }}
              >
                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}
                  >
                    Grade (0–100)
                  </span>
                  <input
                    value={r.grade ?? ""}
                    onChange={async (e) => {
                      await portalApi.updateGrade({
                        studentId,
                        course: r.course,
                        grade: e.target.value,
                      });
                      const data = await portalApi.getStudentDashboard(
                        studentId
                      );
                      setRows(data.rows);
                    }}
                    placeholder="e.g. 87.5"
                    style={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      padding: "10px 12px",
                      outline: "none",
                    }}
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}
                  >
                    Absences used
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={r.absences_used}
                    onChange={async (e) => {
                      await portalApi.updateAbsencesUsed({
                        studentId,
                        course: r.course,
                        absences_used: e.target.value,
                      });
                      const data = await portalApi.getStudentDashboard(
                        studentId
                      );
                      setRows(data.rows);
                    }}
                    style={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      padding: "10px 12px",
                      outline: "none",
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
