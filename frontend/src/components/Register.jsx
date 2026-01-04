import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function isAllowedLiuEmail(email) {
  const e = email.trim().toLowerCase();
  return e.endsWith("@students.liu.edu.lb") || e.endsWith("@liu.edu.lb");
}

export default function Register() {
  const nav = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!firstName.trim() || !lastName.trim() || !cleanEmail || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!isAllowedLiuEmail(cleanEmail)) {
      setError("Please use your LIU email (@students.liu.edu.lb or @liu.edu.lb).");
      return;
    }

    // store values (frontend only for now)
    localStorage.setItem("firstName", firstName.trim());
    localStorage.setItem("lastName", lastName.trim());
    localStorage.setItem("email", cleanEmail);
    localStorage.setItem("password", password);

    nav("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-center text-2xl font-extrabold tracking-wide text-slate-900">
            CREATE AN ACCOUNT
          </h1>

          <p className="mt-2 text-center text-sm text-slate-600">
            Join the Student Portal using the same clean theme.
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
              />
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your LIU Email"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
              />
              <p className="mt-2 text-xs text-slate-500">
                Allowed: @students.liu.edu.lb or @liu.edu.lb
              </p>
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
              />
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-10 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 active:scale-[0.99]"
              >
                Register
              </button>
            </div>

            <div className="pt-2 text-center text-sm text-slate-600">
              Have already an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-slate-900 underline underline-offset-2"
              >
                Login here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
