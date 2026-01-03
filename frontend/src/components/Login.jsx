import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function getRoleFromEmail(email) {
  const e = email.trim().toLowerCase();
  if (e.endsWith("@students.liu.edu.lb")) return "student";
  if (e.endsWith("@liu.edu.lb")) return "teacher";
  return null;
}

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    
    localStorage.removeItem("portal_session");
    localStorage.removeItem("isLoggedIn");
    
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    // 1) empty check FIRST
    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    // 2) domain restriction
    const role = getRoleFromEmail(cleanEmail);
    if (!role) {
      setError("Please use your LIU email (students or teachers).");
      return;
    }

    // 3) your current frontend-only check (localStorage)
    const storedEmail = (localStorage.getItem("email") || "").trim().toLowerCase();
    const storedPassword = localStorage.getItem("password") || "";

    if (cleanEmail !== storedEmail || password !== storedPassword) {
      setError("Invalid email or password.");
      return;
    }

    // 4) save session + redirect by role
    localStorage.setItem(
      "portal_session",
      JSON.stringify({ role, email: cleanEmail })
    );
    localStorage.setItem("isLoggedIn", "true");

    nav(role === "teacher" ? "/teacher" : "/student");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-center text-2xl font-extrabold tracking-wide text-slate-900">
            LOGIN
          </h1>

          {error && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <div>
              <input
                value={email}
                placeholder="Your LIU Email"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
              />
              <p className="mt-2 text-xs text-slate-500">
                Allowed: @students.liu.edu.lb or @liu.edu.lb
              </p>
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
              />
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-10 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 active:scale-[0.99]"
              >
                Login
              </button>
            </div>

            <div className="pt-2 text-center text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-slate-900 underline underline-offset-2"
              >
                Register Here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
