// src/services/portalApi.js
// Frontend-only data layer (mock). Replace internals with Axios later.

const COURSES = ["Web Development", "Math", "Database"];

// In-memory “DB”
let students = [
  { id: "S1", firstName: "Ali", lastName: "Hassan" },
  { id: "S2", firstName: "Maya", lastName: "Khalil" },
];

let records = makeInitialRecords(students);

function makeInitialRecords(studentsList) {
  const rows = [];
  for (const s of studentsList) {
    for (const course of COURSES) {
      rows.push({
        id: `${s.id}__${course}`,
        studentId: s.id,
        course,
        grade: null,
        absences_used: 0,
        absences_allowed: 10,
      });
    }
  }
  return rows;
}

function ensureStudentRecords(studentId) {
  const exists = records.some((r) => r.studentId === studentId);
  if (exists) return;
  for (const course of COURSES) {
    records.push({
      id: `${studentId}__${course}`,
      studentId,
      course,
      grade: null,
      absences_used: 0,
      absences_allowed: 10,
    });
  }
}

function clampInt(n, min, max) {
  const x = parseInt(String(n), 10);
  if (Number.isNaN(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function clampGrade(n) {
  const x = parseFloat(String(n));
  if (Number.isNaN(x)) return null;
  return Math.max(0, Math.min(100, x));
}

// -------- API surface (keep these function names) --------
export const portalApi = {
  getCourses: async () => [...COURSES],

  // Students
  getStudents: async () => [...students],
  addStudent: async ({ firstName, lastName }) => {
    const id = `S${students.length + 1}`;
    const s = { id, firstName, lastName };
    students = [...students, s];
    ensureStudentRecords(id);
    return s;
  },

  // Student view
  getStudentDashboard: async (studentId) => {
    const student = students.find((s) => s.id === studentId) || null;
    const rows = records
      .filter((r) => r.studentId === studentId)
      .map((r) => ({
        ...r,
        absences_left: r.absences_allowed - r.absences_used,
      }));
    return { student, rows };
  },

  // Teacher updates
  updateGrade: async ({ studentId, course, grade }) => {
    const g = grade === "" ? null : clampGrade(grade);
    records = records.map((r) =>
      r.studentId === studentId && r.course === course ? { ...r, grade: g } : r
    );
    return true;
  },

  updateAbsencesUsed: async ({ studentId, course, absences_used }) => {
    const used = clampInt(absences_used, 0, 999);
    records = records.map((r) => {
      if (r.studentId !== studentId || r.course !== course) return r;
      const allowed = r.absences_allowed;
      return { ...r, absences_used: Math.min(used, allowed) };
    });
    return true;
  },
};
