import cors from "cors";
import mysql from "mysql";
import express from "express";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ===============================
// Database connection (MUST be before routes)
// ===============================
const db = mysql.createPool({
  port: 3306,
  host: "localhost",
  user: "root",
  password: "",
  database: "project_db",
});

// Test DB connection
db.getConnection((err) => {
  if (err) console.error("Database connection failed:", err);
  else console.log("Connected to MySQL database");
});

// ===============================
// OTP STORE (TEST MODE)
// ===============================
// { [email]: { code, expires, pending: { firstName, lastName, email, password, studentId } } }
const otpStore = {};

// helper
function isAllowedLiuEmail(email) {
  const e = String(email || "")
    .trim()
    .toLowerCase();
  return e.endsWith("@students.liu.edu.lb") || e.endsWith("@liu.edu.lb");
}

function extractStudentIdFromEmail(email) {
  const e = String(email || "")
    .trim()
    .toLowerCase();
  return e.split("@")[0]; // before @
}

// ===============================
// AUTH – REQUEST OTP (TEST MODE)
// POST /auth/register/request-otp
// Body: { firstName, lastName, email, password }
// ===============================
app.post("/auth/register/request-otp", (req, res) => {
  const { firstName, lastName, email, password } = req.body || {};

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "Missing fields." });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  if (!isAllowedLiuEmail(cleanEmail)) {
    return res.status(400).json({ message: "Invalid LIU email." });
  }

  const studentIdStr = extractStudentIdFromEmail(cleanEmail);
  const studentId = Number(studentIdStr);

  if (Number.isNaN(studentId)) {
    return res.status(400).json({
      message: "Student ID in email must be numeric (before @).",
    });
  }

  // ✅ verify student exists in DB before generating OTP
  db.query("SELECT id FROM student WHERE id = ?", [studentId], (err, rows) => {
    if (err) {
      console.error("REQUEST OTP ERROR:", err);
      return res.status(500).json({ message: "Server error" });
    }
    if (!rows.length) {
      return res.status(404).json({
        message:
          "Student not found in database. Make sure the email ID matches an existing student id.",
      });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));

    otpStore[cleanEmail] = {
      code,
      expires: Date.now() + 5 * 60 * 1000, // 5 min
      pending: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        email: cleanEmail,
        password: String(password), // ⚠️ test mode only. Later hash it.
        studentId,
      },
    };

    console.log("OTP for", cleanEmail, "=", code);

    return res.status(200).json({
      message: "OTP generated (testing mode)",
      code, // remove later
    });
  });
});

// ===============================
// AUTH – VERIFY OTP (TEST MODE)
// POST /auth/register/verify-otp
// Body: { email, code }
// ===============================
app.post("/auth/register/verify-otp", (req, res) => {
  const { email, code } = req.body || {};

  if (!email || !code) {
    return res.status(400).json({ message: "Missing fields." });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  if (!isAllowedLiuEmail(cleanEmail)) {
    return res.status(400).json({ message: "Invalid LIU email." });
  }

  const record = otpStore[cleanEmail];

  if (!record) return res.status(400).json({ message: "No OTP requested." });
  if (Date.now() > record.expires)
    return res.status(400).json({ message: "OTP expired." });

  if (String(code).trim() !== String(record.code).trim()) {
    return res.status(400).json({ message: "Invalid OTP." });
  }

  const pending = record.pending;
  delete otpStore[cleanEmail];

  // return success + user info
  return res.status(200).json({
    message: "Email verified (testing mode)",
    studentId: pending.studentId,
    user: {
      firstName: pending.firstName,
      lastName: pending.lastName,
      email: pending.email,
    },
  });
});

// ===============================
// YOUR OTHER ROUTES (unchanged)
// ===============================

// GET ALL STUDENTS
app.get("/students", (req, res) => {
  const q = "SELECT * FROM student";
  db.query(q, (err, data) => {
    if (err)
      return res.status(500).json({ message: "Database error", error: err });
    if (data.length === 0) return res.status(204).send("No students found");
    return res.status(200).json(data);
  });
});

// GET /students/:id/dashboard
app.get("/students/:id/dashboard", (req, res) => {
  const studentId = Number(req.params.id);
  if (Number.isNaN(studentId)) {
    return res.status(400).json({ message: "Student ID must be a number" });
  }

  db.query(
    "SELECT id, Fname, Lname, Phone, Address FROM student WHERE id = ?",
    [studentId],
    (err, studentRows) => {
      if (err) return res.status(500).json({ message: "Server error" });
      if (!studentRows.length)
        return res.status(404).json({ message: "Student not found" });

      db.query(
        `
        SELECT 
          sc.id,
          sc.course_name AS course,
          sc.grade,
          sc.absences_used,
          sc.absences_allowed,
          (sc.absences_allowed - sc.absences_used) AS absences_left
        FROM student_course sc
        WHERE sc.student_id = ?
        ORDER BY sc.course_name ASC
        `,
        [studentId],
        (err2, rows) => {
          if (err2) return res.status(500).json({ message: "Server error" });

          return res.status(200).json({
            student: studentRows[0],
            rows,
          });
        }
      );
    }
  );
});

// (keep the rest of your CRUD + PUT dashboard as-is)

// ===============================
app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
