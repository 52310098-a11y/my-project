import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

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
  const safeAllowed = Math.max(0, Number(allowed ?? 0));
  const safeUsed = Math.max(0, Math.min(Number(used ?? 0), safeAllowed));
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

const btnDark = {
  borderRadius: 12,
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "white",
  padding: "10px 12px",
  fontWeight: 900,
  cursor: "pointer",
};

const btnLight = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "white",
  color: "#0f172a",
  padding: "10px 12px",
  fontWeight: 900,
  cursor: "pointer",
};

const API = "http://localhost:5000";

export default function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [rows, setRows] = useState([]);

  // draft rows (editable)
  const [draftRows, setDraftRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // alerts
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const clearAlerts = () => {
    setIsSuccess(false);
    setIsError(false);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const showSuccess = (message) => {
    clearAlerts();
    setSuccessMessage(String(message || "Success"));
    setIsSuccess(true);
  };

  const showError = (message) => {
    clearAlerts();
    // backend sometimes returns array of messages
    const msg = Array.isArray(message) ? message.join(", ") : message;
    setErrorMessage(String(msg || "Error"));
    setIsError(true);
  };

  // auto-hide alerts
  useEffect(() => {
    if (!isSuccess && !isError) return;
    const t = setTimeout(() => clearAlerts(), 2500);
    return () => clearTimeout(t);
  }, [isSuccess, isError]);

  const loadStudents = async () => {
    setLoading(true);
    clearAlerts();
    try {
      const res = await axios.get(`${API}/students`);

      // /students returns 204 sometimes -> axios doesn't throw, but data may be ""
      const list = Array.isArray(res.data) ? res.data : [];
      setStudents(list);

      // keep current selection if it still exists, otherwise choose first
      const current =
        studentId && list.find((s) => String(s.id) === String(studentId));
      const nextId = current
        ? String(current.id)
        : list.length
        ? String(list[0].id)
        : "";
      setStudentId(nextId);
    } catch (e) {
      showError(e.response?.data?.message || "Failed to load students.");
      setStudents([]);
      setStudentId("");
      setRows([]);
      setDraftRows([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async (sid) => {
    if (!sid) {
      setRows([]);
      setDraftRows([]);
      return;
    }

    setLoading(true);
    clearAlerts();
    try {
      const res = await axios.get(`${API}/students/${sid}/dashboard`);
      const newRows = Array.isArray(res.data?.rows) ? res.data.rows : [];

      setRows(newRows);

      // initialize draft from server rows
      setDraftRows(
        newRows.map((r) => ({
          id: r.id,
          course: r.course, // IMPORTANT: backend PUT expects course_name (we send "course")
          grade: r.grade, // null means ungraded
          absences_used: r.absences_used ?? 0,
          absences_allowed: r.absences_allowed ?? 0,
          absences_left: r.absences_left ?? 0,
        }))
      );
    } catch (e) {
      showError(e.response?.data?.message || "Failed to load dashboard.");
      setRows([]);
      setDraftRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadDashboard(studentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const refresh = async () => {
    await loadStudents(); // refresh list + keeps selection if possible
    if (studentId) await loadDashboard(studentId);
  };

  const patchDraftRow = (rowId, patch) => {
    setDraftRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r))
    );
  };

  const hasUnsavedChanges = useMemo(() => {
    if (rows.length !== draftRows.length) return true;
    const map = new Map(rows.map((r) => [r.id, r]));

    for (const d of draftRows) {
      const r = map.get(d.id);
      if (!r) return true;

      const g1 = r.grade == null ? null : Number(r.grade);
      const g2 = d.grade == null || d.grade === "" ? null : Number(d.grade);

      const a1 = Number(r.absences_used ?? 0);
      const a2 = Number(d.absences_used ?? 0);

      if (g1 !== g2 || a1 !== a2) return true;
    }
    return false;
  }, [rows, draftRows]);

  const validateDraft = () => {
    for (const r of draftRows) {
      // grade: allow null/"" (ungraded)
      if (r.grade !== null && r.grade !== "") {
        const g = Number(r.grade);
        if (Number.isNaN(g) || g < 0 || g > 100) {
          return `Invalid grade for ${r.course}. Must be 0–100 or empty.`;
        }
      }

      const a = Number(r.absences_used);
      if (Number.isNaN(a) || a < 0) {
        return `Invalid absences for ${r.course}. Must be 0 or more.`;
      }

      const allowed = Number(r.absences_allowed ?? 0);
      if (!Number.isNaN(allowed) && a > allowed) {
        return `Absences used cannot exceed allowed for ${r.course}.`;
      }
    }
    return "";
  };

  const updateAll = async () => {
    if (!studentId) return;

    const validationError = validateDraft();
    if (validationError) {
      showError(validationError);
      return;
    }

    // BACKEND EXPECTS: { rows: [{ course, grade, absences_used }] }
    // (your backend PUT uses course_name matching, not row id)
    const payload = {
      rows: draftRows.map((r) => ({
        course: r.course,
        grade: r.grade === "" ? null : r.grade == null ? null : Number(r.grade),
        absences_used:
          r.absences_used === "" || r.absences_used == null
            ? 0
            : Number(r.absences_used),
      })),
    };

    setLoading(true);
    clearAlerts();
    try {
      const res = await axios.put(
        `${API}/students/${studentId}/dashboard`,
        payload
      );

      showSuccess(res.data?.message || "Dashboard updated successfully.");
      await loadDashboard(studentId); // reload from server
    } catch (e) {
      showError(e.response?.data?.message || "Failed to update dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const selectedStudentLabel = useMemo(() => {
    const s = students.find((x) => String(x.id) === String(studentId));
    if (!s) return "—";
    return `${s.Fname ?? ""} ${s.Lname ?? ""}`.trim();
  }, [students, studentId]);

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
                minWidth: 260,
              }}
              disabled={loading || students.length === 0}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.Fname} {s.Lname}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={refresh}
              style={{ ...btnDark, opacity: loading ? 0.7 : 1 }}
              type="button"
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 10, fontSize: 13, color: "#64748b" }}>
          Selected: <b style={{ color: "#0f172a" }}>{selectedStudentLabel}</b>
        </div>

        {(isSuccess || isError) && (
          <div
            style={{
              marginTop: 12,
              border: `1px solid ${isError ? "#fecaca" : "#bbf7d0"}`,
              background: isError ? "#fef2f2" : "#f0fdf4",
              color: isError ? "#991b1b" : "#166534",
              padding: 12,
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {isError ? errorMessage : successMessage}
          </div>
        )}
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

          {!rows.length && (
            <div style={{ color: "#64748b", fontSize: 13 }}>
              No courses found for this student.
            </div>
          )}
        </div>
      </Card>

      <Card title="Edit Grades & Absences">
        <div style={{ display: "grid", gap: 12 }}>
          {draftRows.map((r) => {
            const used = Number(r.absences_used ?? 0);
            const allowed = Number(r.absences_allowed ?? 0);
            const left = Math.max(0, allowed - (Number.isNaN(used) ? 0 : used));

            return (
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
                    Absences left: <b>{left}</b>
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
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        fontWeight: 800,
                      }}
                    >
                      Grade (0–100) — leave empty for ungraded
                    </span>
                    <input
                      value={r.grade ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;

                        // allow empty (ungraded)
                        if (v === "") {
                          patchDraftRow(r.id, { grade: null });
                          return;
                        }

                        // allow typing; validate on save
                        patchDraftRow(r.id, { grade: v });
                      }}
                      placeholder="e.g. 87.5"
                      style={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        padding: "10px 12px",
                        outline: "none",
                      }}
                      disabled={loading}
                    />
                  </label>

                  <label style={{ display: "grid", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        fontWeight: 800,
                      }}
                    >
                      Absences used
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={999}
                      value={r.absences_used}
                      onChange={(e) => {
                        patchDraftRow(r.id, { absences_used: e.target.value });
                      }}
                      style={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        padding: "10px 12px",
                        outline: "none",
                      }}
                      disabled={loading}
                    />
                  </label>
                </div>
              </div>
            );
          })}

          {!draftRows.length && (
            <div style={{ color: "#64748b", fontSize: 13 }}>
              No courses to edit.
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              onClick={updateAll}
              style={{
                ...btnDark,
                opacity: loading || !hasUnsavedChanges ? 0.6 : 1,
                cursor:
                  loading || !hasUnsavedChanges ? "not-allowed" : "pointer",
              }}
              disabled={loading || !hasUnsavedChanges || !draftRows.length}
              title={
                !hasUnsavedChanges ? "No changes to save" : "Save all changes"
              }
            >
              {loading ? "Saving..." : "Update"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
