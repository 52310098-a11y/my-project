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
