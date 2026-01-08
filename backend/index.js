import express from "express";
import cors from "cors";
import mysql from "mysql";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

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

/* ----------------------------------------------------
   GET ALL STUDENTS DASHBOARD (one request)
   IMPORTANT: must be ABOVE /students/:id
   GET /students/dashboard  ->  [ { student, rows }, ... ]
---------------------------------------------------- */
app.get("/students/dashboard", (req, res) => {
  const q = `
    SELECT
      s.id AS studentId,
      s.Fname, s.Lname, s.Phone, s.Address,
      sc.id AS rowId,
      sc.course_name AS course,
      sc.grade,
      sc.absences_used,
      sc.absences_allowed,
      (sc.absences_allowed - sc.absences_used) AS absences_left
    FROM student s
    LEFT JOIN student_course sc ON sc.student_id = s.id
    ORDER BY s.id ASC, sc.course_name ASC
  `;

  db.query(q, (err, data) => {
    if (err) {
      console.error("ALL DASHBOARD ERROR:", err);
      return res.status(500).json({ message: "Server error" });
    }

    // If no students at all
    if (!data || data.length === 0) {
      return res.status(200).json([]);
    }

    // Group by studentId
    const map = {};
    for (const r of data) {
      if (!map[r.studentId]) {
        map[r.studentId] = {
          student: {
            id: r.studentId,
            Fname: r.Fname,
            Lname: r.Lname,
            Phone: r.Phone,
            Address: r.Address,
          },
          rows: [],
        };
      }

      // If student has no courses (LEFT JOIN), rowId will be null
      if (r.rowId != null) {
        map[r.studentId].rows.push({
          id: r.rowId,
          course: r.course,
          grade: r.grade, // null = ungraded, 0 = real grade 0
          absences_used: r.absences_used,
          absences_allowed: r.absences_allowed,
          absences_left: r.absences_left,
        });
      }
    }

    return res.status(200).json(Object.values(map));
  });
});

// // GET /students/:id/dashboard  -> { student, rows }
// app.get("/students/:id/dashboard", (req, res) => {
//   const studentId = Number(req.params.id);

//   if (Number.isNaN(studentId)) {
//     return res.status(400).json({ message: "Student ID must be a number" });
//   }

//   db.query(
//     "SELECT id, Fname, Lname, Phone, Address FROM student WHERE id = ?",
//     [studentId],
//     (err, studentRows) => {
//       if (err) {
//         console.error("DASHBOARD GET ERROR:", err);
//         return res.status(500).json({ message: "Server error" });
//       }

//       if (!studentRows.length) {
//         return res.status(404).json({ message: "Student not found" });
//       }

//       db.query(
//         `
//         SELECT
//           sc.id,
//           sc.course_name AS course,
//           sc.grade,
//           sc.absences_used,
//           sc.absences_allowed,
//           (sc.absences_allowed - sc.absences_used) AS absences_left
//         FROM student_course sc
//         WHERE sc.student_id = ?
//         ORDER BY sc.course_name ASC
//         `,
//         [studentId],
//         (err2, rows) => {
//           if (err2) {
//             console.error("DASHBOARD GET ERROR:", err2);
//             return res.status(500).json({ message: "Server error" });
//           }

//           return res.status(200).json({
//             student: studentRows[0],
//             rows,
//           });
//         }
//       );
//     }
//   );
// });

// PUT /students/:id/dashboard  -> updates grade + absences_used for courses
app.put("/students/:id/dashboard", (req, res) => {
  const studentId = Number(req.params.id);

  if (Number.isNaN(studentId)) {
    return res.status(400).json({ message: "Student ID must be a number" });
  }

  const rows = req.body?.rows;

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ message: "rows[] is required" });
  }

  // Build a list of updates: [grade, absences_used, studentId, course]
  const updates = [];
  for (const r of rows) {
    const course = r.course;
    const grade = r.grade === "" ? null : r.grade; // "" -> null (ungraded)
    const absences_used =
      r.absences_used === "" || r.absences_used == null
        ? 0
        : Number(r.absences_used);

    if (!course) {
      return res.status(400).json({ message: "Each row must include course" });
    }
    if (Number.isNaN(absences_used) || absences_used < 0) {
      return res
        .status(400)
        .json({ message: `Invalid absences_used for course ${course}` });
    }
    if (
      grade != null &&
      (Number.isNaN(Number(grade)) || Number(grade) < 0 || Number(grade) > 100)
    ) {
      return res
        .status(400)
        .json({ message: `Invalid grade for course ${course}` });
    }

    updates.push([
      grade == null ? null : Number(grade),
      absences_used,
      studentId,
      course,
    ]);
  }

  // 1) verify student exists
  db.query("SELECT id FROM student WHERE id = ?", [studentId], (err0, s) => {
    if (err0) {
      console.error("DASHBOARD PUT ERROR:", err0);
      return res.status(500).json({ message: "Server error" });
    }
    if (!s.length)
      return res.status(404).json({ message: "Student not found" });

    // 2) Run updates (simple loop, no Promise)
    let done = 0;
    let failed = false;

    for (const params of updates) {
      db.query(
        `
        UPDATE student_course
        SET grade = ?, absences_used = ?
        WHERE student_id = ? AND course_name = ?
        `,
        params,
        (err) => {
          if (failed) return;

          if (err) {
            failed = true;
            console.error("DASHBOARD PUT ERROR:", err);
            return res.status(500).json({ message: "Server error" });
          }

          done += 1;

          if (done === updates.length) {
            return res
              .status(200)
              .json({ message: "Dashboard updated successfully" });
          }
        }
      );
    }
  });
});

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

//for deployment
app.listen(process.env.PORT || 5000, () => console.log("API running"));
