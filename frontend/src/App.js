import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./components/Login";
import AuthLayout from "./components/AuthLayout";
import Register from "./components/Register";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import NotFound from "./pages/NotFound";
import StudentDashboardStudent from "./pages/StudentDashboardStudent";
import ProtectedRoutes from "./services/ProtectedRoutes";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <Routes>
      {/* AUTH ROUTES (NO NAVBAR) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student" element={<StudentDashboardStudent />} />
        <Route path="/" element={<ProtectedRoutes />}>
          <Route element={<ProtectedRoutes allow="student" />}>
            <Route path="/student" element={<StudentDashboardStudent />} />
          </Route>
        </Route>
      </Route>

      {/* APP ROUTES (WITH NAVBAR) */}
      <Route element={<Layout />}>
        {/* Default: if logged in, go to your role home */}
        <Route path="/" element={<ProtectedRoutes />}>
          <Route index element={<RoleRedirect />} />
        </Route>
        {/* TEACHER ONLY */}
        {/* <Route element={<ProtectedRoutes allow="teacher" />}> */}
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/students" element={<StudentDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        {/* </Route> */}
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
/* Redirect based on role stored in localStorage */
function RoleRedirect() {
  let role = null;
  try {
    role = JSON.parse(localStorage.getItem("portal_session") || "null")?.role;
  } catch {}

  if (role === "teacher") return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />; // default student
}
