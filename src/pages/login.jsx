import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";

// The 'setUser' prop is no longer needed
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    // signInWithPassword will automatically trigger the onAuthStateChange
    // listener in App.jsx, which now handles all user state.
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    }
    // The call to setUser is removed from here.
    setLoading(false);
  };

  // The rest of your login component code remains the same...
  // ... (sendResetEmail function, and the return() with JSX)

  const sendResetEmail = async (emailAddress) => {
    if (
      supabase.auth &&
      typeof supabase.auth.resetPasswordForEmail === "function"
    ) {
      return await supabase.auth.resetPasswordForEmail(emailAddress, {
        redirectTo: window.location.origin + "/login",
      });
    }
    if (
      supabase.auth &&
      supabase.auth.api &&
      typeof supabase.auth.api.resetPasswordForEmail === "function"
    ) {
      return await supabase.auth.api.resetPasswordForEmail(emailAddress);
    }
    throw new Error(
      "Supabase reset password API not available in this client version"
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md animate-fade-in">
        <div className="flex justify-center mb-6"></div>
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Welcome Back
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="block mb-2 text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg p-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex justify-between items-center mb-6">
            <button
              type="button"
              onClick={() => {
                setShowReset((s) => !s);
                setResetEmail(email || "");
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {showReset && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Enter your account email to receive reset instructions
              </label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-lg p-2 mb-3"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!resetEmail) {
                      alert("Please enter your email");
                      return;
                    }
                    try {
                      setLoading(true);
                      const result = await sendResetEmail(resetEmail);
                      if (result?.error) {
                        console.error("Reset error:", result.error);
                        alert(
                          "Failed to send reset email: " + result.error.message
                        );
                      } else {
                        alert("Password reset email sent. Check your inbox.");
                        setShowReset(false);
                      }
                    } catch (err) {
                      console.error(err);
                      alert("Unexpected error: " + err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg"
                >
                  Send reset email
                </button>
                <button
                  type="button"
                  onClick={() => setShowReset(false)}
                  className="px-3 py-2 rounded-lg border"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-semibold py-3 rounded-lg shadow-md disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
