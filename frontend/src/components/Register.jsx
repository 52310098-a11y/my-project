import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";

function isAllowedLiuEmail(email) {
  const e = email.trim().toLowerCase();
  return e.endsWith("@students.liu.edu.lb") || e.endsWith("@liu.edu.lb");
}

function emailToStudentId(email) {
  const clean = email.trim().toLowerCase();
  return clean.split("@")[0] || "";
}

export default function Register() {
  const nav = useNavigate();

  const [step, setStep] = useState("form");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const cleanEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const studentId = useMemo(() => emailToStudentId(cleanEmail), [cleanEmail]);

  const requestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!firstName.trim() || !lastName.trim() || !cleanEmail || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!isAllowedLiuEmail(cleanEmail)) {
      setError("Please use your LIU email (@students.liu.edu.lb or @liu.edu.lb).");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/auth/register/request-otp`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: cleanEmail,
        password,
      });

      setStep("verify");
      setInfo(`We sent a verification code to ${cleanEmail}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!code.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/register/verify-otp`, {
        email: cleanEmail,
        code: code.trim(),
      });

      // ✅ store session
      localStorage.setItem(
        "portal_session",
        JSON.stringify({
          studentId: res.data.studentId,
          email: res.data.user.email,
          firstName: res.data.user.firstName,
          lastName: res.data.user.lastName,
        })
      );
      localStorage.setItem("isLoggedIn", "true");

      setInfo("Verified! Redirecting...");
      nav("/student"); // or nav("/login") if you want login first
    } catch (err) {
      setError(err.response?.data?.message || "Invalid/expired code.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await axios.post(`${API}/auth/register/request-otp`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: cleanEmail,
        password,
      });
      setInfo(`Code resent to ${cleanEmail}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-center text-2xl font-extrabold tracking-wide text-slate-900">
            {step === "form" ? "CREATE AN ACCOUNT" : "VERIFY YOUR EMAIL"}
          </h1>

          <p className="mt-2 text-center text-sm text-slate-600">
            {step === "form"
              ? "Join the Student Portal using the same clean theme."
              : "Enter the code sent to your LIU email."}
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          {info && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {info}
            </div>
          )}

          {step === "form" ? (
            <form onSubmit={requestOtp} className="mt-6 space-y-5">
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
                {cleanEmail && (
                  <p className="mt-1 text-xs text-slate-500">
                    Student ID will be: <b>{studentId || "—"}</b>
                  </p>
                )}
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
                  disabled={loading}
                  className="rounded-xl bg-slate-900 px-10 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60"
                >
                  {loading ? "Sending code..." : "Register"}
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
          ) : (
            <form onSubmit={verifyOtp} className="mt-6 space-y-5">
              <div>
                <div className="mb-2 text-xs text-slate-500">Email</div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">
                  {cleanEmail}
                </div>
              </div>

              <div>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Verification code (e.g. 123456)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Tip: check Spam/Promotions too.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900"
                  disabled={loading}
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={resendOtp}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900"
                  disabled={loading}
                >
                  Resend
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-slate-900 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? "Verifying..." : "Verify"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
