import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

function Card({ title, action, children }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 16,
      }}
    >
      <div
        style={{
          fontWeight: 900,
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>{title}</div>
        {action ? <div>{action}</div> : null}
      </div>

      {children}
    </div>
  );
}

const btnDark = {
  borderRadius: 14,
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "white",
  padding: "10px 18px",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 1px 0 rgba(0,0,0,0.15)",
};

const btnDanger = {
  borderRadius: 12,
  border: "1px solid #ef4444",
  background: "#ef4444",
  color: "white",
  padding: "10px 12px",
  fontWeight: 900,
  cursor: "pointer",
};

const btnLight = {
  borderRadius: 14,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#0f172a",
  padding: "10px 18px",
  fontWeight: 900,
  cursor: "pointer",
};

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);

  // edit mode
  const [selectedId, setSelectedId] = useState(null);

  // form
  const [Fname, setFname] = useState("");
  const [Lname, setLname] = useState("");
  const [Phone, setPhone] = useState("");
  const [Address, setAddress] = useState("");

  // delete modal
  const [confirmId, setConfirmId] = useState(null);

  // alerts (same idea as your other code)
  const [isLoading, setIsLoading] = useState(false);
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
    setSuccessMessage(message);
    setIsSuccess(true);
  };

  const showError = (message) => {
    clearAlerts();
    setErrorMessage(message);
    setIsError(true);
  };

  // auto-clear success after 2.5 sec
  useEffect(() => {
    if (!isSuccess) return;
    const t = setTimeout(() => clearAlerts(), 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const clearForm = () => {
    setSelectedId(null);
    setFname("");
    setLname("");
    setPhone("");
    setAddress("");
  };

  // READ
  const getStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/students");

      if (response.status === 200) setStudents(response.data);
      if (response.status === 204) setStudents([]);
    } catch (err) {
      showError(err.response?.data?.message || "Error loading students.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getStudents();
  }, [getStudents]);

  const canSave = useMemo(() => {
    return Fname.trim() && Lname.trim() && Phone.trim() && Address.trim();
  }, [Fname, Lname, Phone, Address]);

  // CREATE
  const addStudent = async () => {
    const fn = Fname.trim();
    const ln = Lname.trim();
    const ph = Phone.trim();
    const ad = Address.trim();

    if (!fn || !ln || !ph || !ad) {
      showError("Please fill in all fields before adding a student.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post("/students", {
        Fname: fn,
        Lname: ln,
        Phone: ph,
        Address: ad,
      });

      if (response.status === 201 || response.status === 200) {
        showSuccess(response.data?.message || "Student added.");
        clearForm();
        await getStudents();
      }
    } catch (err) {
      showError(err.response?.data?.message || "Error adding student.");
    } finally {
      setIsLoading(false);
    }
  };

  // EDIT
  const startEdit = (student) => {
    clearAlerts();
    setSelectedId(student.id);
    setFname(student.Fname || "");
    setLname(student.Lname || "");
    setPhone(student.Phone || "");
    setAddress(student.Address || "");
  };

  // UPDATE
  const updateStudent = async () => {
    const fn = Fname.trim();
    const ln = Lname.trim();
    const ph = Phone.trim();
    const ad = Address.trim();

    if (!fn || !ln || !ph || !ad) {
      showError("Please fill in all fields before updating a student.");
      return;
    }
    if (!selectedId) {
      showError("Click Edit on a student first.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.put(`/students/${selectedId}`, {
        Fname: fn,
        Lname: ln,
        Phone: ph,
        Address: ad,
      });

      if (response.status === 200) {
        showSuccess(response.data?.message || "Student updated.");
        clearForm();
        await getStudents();
      }
    } catch (err) {
      showError(err.response?.data?.message || "Error updating student.");
    } finally {
      setIsLoading(false);
    }
  };

  // DELETE (confirmed)
  const confirmDelete = async () => {
    if (!confirmId) return;

    try {
      setIsLoading(true);
      const response = await axios.delete(`/students/${confirmId}`);

      if (response.status === 200) {
        showSuccess(response.data?.message || "Student deleted.");
        setConfirmId(null);

        if (selectedId === confirmId) clearForm();
        await getStudents();
      }
    } catch (err) {
      showError(err.response?.data?.message || "Error deleting student.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card
        title={
          selectedId
            ? `Admin — Update Student (ID: ${selectedId})`
            : "Admin — Add Student"
        }
        action={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={getStudents} type="button" style={btnDark}>
              {isLoading ? "Loading..." : "Refresh"}
            </button>

            <button
              onClick={() => {
                clearAlerts();
                clearForm();
              }}
              type="button"
              style={btnLight}
              disabled={isLoading}
            >
              Clear
            </button>
          </div>
        }
      >
        {/* Alerts */}
        {(isSuccess || isError) && (
          <div
            style={{
              marginBottom: 12,
              borderRadius: 14,
              border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}`,
              background: isSuccess ? "#f0fdf4" : "#fff1f2",
              color: isSuccess ? "#166534" : "#991b1b",
              padding: "10px 12px",
              fontWeight: 800,
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "center",
            }}
          >
            <span>{isSuccess ? successMessage : errorMessage}</span>
            <button
              type="button"
              onClick={clearAlerts}
              style={{
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "white",
                padding: "6px 10px",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              X
            </button>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
            alignItems: "end",
          }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
              First name
            </span>
            <input
              value={Fname}
              onChange={(e) => setFname(e.target.value)}
              style={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                padding: "10px 12px",
              }}
              disabled={isLoading}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
              Last name
            </span>
            <input
              value={Lname}
              onChange={(e) => setLname(e.target.value)}
              style={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                padding: "10px 12px",
              }}
              disabled={isLoading}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
              Phone
            </span>
            <input
              value={Phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                padding: "10px 12px",
              }}
              disabled={isLoading}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
              Address
            </span>
            <input
              value={Address}
              onChange={(e) => setAddress(e.target.value)}
              style={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                padding: "10px 12px",
              }}
              disabled={isLoading}
            />
          </label>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={addStudent}
              type="button"
              disabled={!canSave || !!selectedId || isLoading}
              style={{
                borderRadius: 12,
                border: "1px solid #0f172a",
                background:
                  !canSave || selectedId || isLoading ? "#94a3b8" : "#0f172a",
                color: "white",
                padding: "10px 12px",
                fontWeight: 900,
                cursor:
                  !canSave || selectedId || isLoading
                    ? "not-allowed"
                    : "pointer",
                minWidth: 110,
              }}
            >
              Add
            </button>

            <button
              onClick={updateStudent}
              type="button"
              disabled={!canSave || !selectedId || isLoading}
              style={{
                borderRadius: 12,
                border: "1px solid #0f172a",
                background:
                  !canSave || !selectedId || isLoading ? "#94a3b8" : "#0f172a",
                color: "white",
                padding: "10px 12px",
                fontWeight: 900,
                cursor:
                  !canSave || !selectedId || isLoading
                    ? "not-allowed"
                    : "pointer",
                minWidth: 110,
              }}
            >
              Update
            </button>
          </div>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
          Tip: Click <b>Edit</b> on a student to load their data, then click{" "}
          <b>Update</b>. Click <b>Clear</b> to exit edit mode.
        </div>
      </Card>

      <Card title="Current Students">
        <div style={{ display: "grid", gap: 8 }}>
          {students.map((s) => (
            <div
              key={s.id}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 110px 150px",
                gap: 10,
                alignItems: "center",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 10,
                background: selectedId === s.id ? "#f8fafc" : "white",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              <div style={{ fontWeight: 900 }}>{s.id}</div>

              <div style={{ display: "grid", gap: 2 }}>
                <div style={{ fontWeight: 800 }}>
                  {s.Fname} {s.Lname}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {s.Phone || "—"} • {s.Address || "—"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => startEdit(s)}
                style={{
                  ...btnLight,
                  padding: "10px 12px",
                  justifySelf: "end",
                }}
                disabled={isLoading}
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => setConfirmId(s.id)}
                style={{ ...btnDanger, justifySelf: "end" }}
                disabled={isLoading}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* confirm modal */}
      {confirmId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.6)",
            display: "grid",
            placeItems: "center",
            zIndex: 50,
            padding: 16,
          }}
          onClick={() => setConfirmId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 380,
              background: "white",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              padding: 20,
              boxShadow: "0 10px 30px rgba(0,0,0,.15)",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 18 }}>Delete student?</div>
            <div style={{ marginTop: 8, fontSize: 14, color: "#64748b" }}>
              This action cannot be undone.
            </div>

            <div
              style={{
                marginTop: 18,
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                style={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  background: "white",
                  padding: "10px 12px",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
                disabled={isLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                style={btnDanger}
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
