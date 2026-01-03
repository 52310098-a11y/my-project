import cors from "cors";
import mysql from "mysql";
import express from "express";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});

// Database connection
const db = mysql.createPool({
  port: 3306,
  host: "localhost",
  user: "root",
  password: "",
  database: "project_db",
});

// Test DB connection
db.getConnection((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

/* ----------------------------------------------------
   GET ALL STUDENTS
---------------------------------------------------- */
app.get("/students", (req, res) => {
  const q = "SELECT * FROM student";

  db.query(q, (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    } else {
      if (data.length === 0) {
        return res.status(204).send("No students found");
      }
      return res.status(200).json(data);
    }
  });
});

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

// GET /students/:id/dashboard  -> { student, rows }
app.get("/students/:id/dashboard", (req, res) => {
  const studentId = Number(req.params.id);

  if (Number.isNaN(studentId)) {
    return res.status(400).json({ message: "Student ID must be a number" });
  }

  db.query(
    "SELECT id, Fname, Lname, Phone, Address FROM student WHERE id = ?",
    [studentId],
    (err, studentRows) => {
      if (err) {
        console.error("DASHBOARD GET ERROR:", err);
        return res.status(500).json({ message: "Server error" });
      }

      if (!studentRows.length) {
        return res.status(404).json({ message: "Student not found" });
      }

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
          if (err2) {
            console.error("DASHBOARD GET ERROR:", err2);
            return res.status(500).json({ message: "Server error" });
          }

          return res.status(200).json({
            student: studentRows[0],
            rows,
          });
        }
      );
    }
  );
});

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

/* ----------------------------------------------------
   GET STUDENT BY ID
---------------------------------------------------- */
app.get("/students/:id", (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({ message: "Student ID is required" });
  }

  if (isNaN(Number(id))) {
    return res.status(400).json({ message: "Student ID must be a number" });
  }

  const q = "SELECT * FROM student WHERE id = ?";

  db.query(q, [id], (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    } else {
      if (data.length === 0) {
        return res.status(404).json({ message: "Student not found" });
      }
      return res.status(200).json(data[0]);
    }
  });
});

/* ----------------------------------------------------
   CHECK STUDENT BY PHONE
---------------------------------------------------- */
app.get("/getStudentsbyphone/:phone", (req, res) => {
  const phone = req.params.phone;

  if (!phone) {
    return res.status(400).json({ message: "Phone number is required" });
  }
  const q = "SELECT * FROM student WHERE phone = ?";

  db.query(q, [phone], (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    } else {
      if (data.length === 0) {
        return res.status(404).json({ message: "Student not found" });
      }
      return res.status(200).json(data[0]);
    }
  });
});

/* ----------------------------------------------------
   ADD NEW STUDENT
---------------------------------------------------- */
app.post("/students", (req, res) => {
  if (!req.body) {
    return res.status(400).send("Request body is missing");
  }

  const { Fname, Lname, Phone, Address } = req.body;

  const errors = [];
  if (!Fname) {
    errors.push("First name is required");
  }
  if (!Lname) {
    errors.push("Last name is required");
  }
  if (!Phone) {
    errors.push("Phone is required");
  }
  if (errors.length > 0) {
    return res.status(400).json({ message: errors });
  }
  const q =
    "INSERT INTO student (Fname, Lname, Phone, Address) VALUES (?, ?, ?, ?)";

  db.query(q, [Fname, Lname, Phone, Address], (err, data) => {
    if (err) {
      if (err.errno === 1062) {
        return res.status(400).json({ message: err.sqlMessage });
      }
      return res.status(500).json({ message: "Database error", error: err });
    } else {
      return res.status(201).json({
        message: "Student created successfully",
        id: data.insertId,
      });
    }
  });
});

/* ----------------------------------------------------
   UPDATE STUDENT
---------------------------------------------------- */
app.put("/students/:id", (req, res) => {
  if (!req.body) {
    return res.status(400).send("Request body is missing");
  }

  const { id } = req.params;
  const { Fname, Lname, Phone, Address } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Student ID is required" });
  }

  if (isNaN(Number(id))) {
    return res.status(400).json({ message: "Student ID must be a number" });
  }

  if (!Fname || !Lname || !Phone || !Address) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const q =
    "UPDATE student SET Fname = ?, Lname = ?, Phone = ?, Address = ? WHERE id = ?";

  db.query(q, [Fname, Lname, Phone, Address, id], (err, data) => {
    if (err) {
      if (err.errno === 1062) {
        return res.status(400).json({ message: err.sqlMessage });
      }
      return res.status(500).json({ message: "Database error", error: err });
    } else {
      if (data.affectedRows === 0) {
        return res.status(404).json({ message: "Student not found" });
      }
      return res.status(200).json({ message: "Student updated successfully" });
    }
  });
});

/* ----------------------------------------------------
   DELETE STUDENT
---------------------------------------------------- */
app.delete("/students/:id", (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Student ID is required" });
  }

  if (isNaN(Number(id))) {
    return res.status(400).json({ message: "Student ID must be a number" });
  }

  const q = "DELETE FROM student WHERE id = ?";

  db.query(q, [id], (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    } else {
      if (data.affectedRows === 0) {
        return res.status(404).json({ message: "Student not found" });
      }
      return res.status(200).json({ message: "Student deleted successfully" });
    }
  });
});
