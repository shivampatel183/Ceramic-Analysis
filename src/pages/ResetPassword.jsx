// src/pages/ResetPassword.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Loader2 } from "lucide-react";

export default function ResetPassword() {
  const [booting, setBooting] = useState(true);
  const [msg, setMsg] = useState("");
  const [pw, setPw] = useState("");
  const [cpw, setCpw] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // For HashRouter, params are after '#'
        // Example: #/reset-password?code=...&type=recovery
        const afterHash = window.location.hash.split("?")[1] || "";
        const params = new URLSearchParams(afterHash);
        const code =
          params.get("code") ||
          params.get("access_token") ||
          params.get("token_hash");

        // If your supabase-js version supports it, prefer exchangeCodeForSession:
        if (code) {
          // v2: exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(
            code
          );
          if (error) {
            setMsg(error.message);
          }
        }

        // If there was no code (e.g., user loaded this page directly), that's fine;
        // they'll see the message below when they try to reset.
      } catch (e) {
        setMsg(e.message || "Failed to process reset link.");
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (pw.length < 8) return setMsg("Password must be at least 8 characters.");
    if (pw !== cpw) return setMsg("Passwords do not match.");

    // Ensure we actually have a session (came from a valid link)
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      return setMsg(
        "This reset link is invalid or has expired. Please request a new one from the login page."
      );
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);

    setMsg(error ? error.message : "Password updated! You can now log in.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Set a new password
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Enter your new password below.
        </p>

        {msg && (
          <div
            className={`mb-4 rounded-md border px-3 py-2 text-sm ${
              /invalid|expired/i.test(msg)
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-green-300 bg-green-50 text-green-700"
            }`}
          >
            {msg}
          </div>
        )}

        {booting ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="animate-spin" />
            Validating reset link…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={cpw}
                onChange={(e) => setCpw(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition text-white font-semibold py-3 rounded-lg disabled:bg-indigo-400"
            >
              {saving ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Update password"
              )}
            </button>
          </form>
        )}

        <p className="text-xs text-gray-500 mt-6">
          If you arrived here without using a reset link, go back and request a
          new one.
        </p>
      </div>
    </div>
  );
}
