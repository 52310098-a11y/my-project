import { Outlet, Navigate } from "react-router-dom";
import React from "react";

const getSession = () => {
  try {
    return JSON.parse(localStorage.getItem("portal_session") || "null");
  } catch {
    return null;
  }
};

const ProtectedRoutes = ({ allow }) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const session = getSession();

  // not logged in at all
  if (!isLoggedIn || !session) {
    return <Navigate to="/login" replace />;
  }

  // role-based protection
  if (allow && session.role !== allow) {
    return (
      <Navigate
        to={session.role === "teacher" ? "/teacher" : "/student"}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoutes;
