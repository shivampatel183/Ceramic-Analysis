import React, { useEffect, useState, useCallback } from "react";
import { Home, BarChart3, Database, User, LogOut } from "lucide-react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  NavLink,
} from "react-router-dom";
import { supabase } from "./supabaseClient";

import Homepage from "./pages/home";
import Sheet from "./pages/sheet";
import Profile from "./pages/profile";
import Login from "./pages/login";
import Register from "./pages/register";
import Data from "./pages/data";
import Analysis from "./pages/analysis";
import UserManagement from "./pages/UserManagement";

// ✅ Sidebar Component
const Sidebar = ({ onLogout, userRole }) => (
  <div className="fixed top-0 left-0 h-screen w-[250px] backdrop-blur-md bg-white/30 border-r border-gray-200 text-gray-900 flex flex-col px-6 py-8 shadow-md z-50 font-[system-ui]">
    <h2 className="text-2xl font-bold mb-10 tracking-tight text-blue-600">
      Ceramic Cost Calculator
    </h2>
    <nav className="flex flex-col gap-3 text-[15px]">
      {userRole === "admin" ? (
        <>
          <NavItem to="/home" icon={<Home size={18} />} label="Home" />
          <NavItem to="/sheet" icon={<BarChart3 size={18} />} label="Entry" />
          <NavItem to="/data" icon={<Database size={18} />} label="Data" />
          <NavItem
            to="/analysis"
            icon={<BarChart3 size={18} />}
            label="Analysis"
          />
          <NavItem
            to="/usermanagement"
            icon={<User size={18} />}
            label="User Management"
          />
          <NavItem to="/profile" icon={<User size={18} />} label="Profile" />
        </>
      ) : (
        <>
          <NavItem to="/sheet" icon={<BarChart3 size={18} />} label="Entry" />
          <NavItem to="/data" icon={<Database size={18} />} label="Data" />
        </>
      )}
    </nav>

    <button
      onClick={onLogout}
      className="mt-auto flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm py-2 rounded-lg shadow transition"
    >
      <LogOut size={16} /> Logout
    </button>
  </div>
);

// ✅ Reusable Nav Item
const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 p-2 rounded-lg transition ${
        isActive
          ? "bg-blue-200 text-blue-700"
          : "hover:bg-blue-100 hover:text-blue-600"
      }`
    }
  >
    {icon} {label}
  </NavLink>
);

// ✅ Protected Route Wrapper
const ProtectedRoute = ({ isAllowed, redirectPath = "/login", children }) =>
  !isAllowed ? <Navigate to={redirectPath} replace /> : children;

// ✅ Main App Component
export default function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch user profile safely (only when needed)
  const fetchUserProfile = useCallback(async (user) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, department")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      // ✅ Cache profile to avoid re-fetch on route change
      localStorage.setItem("userProfile", JSON.stringify(data));
      setUserProfile(data);
    } catch (err) {
      console.error("Error fetching user role:", err.message);
      await supabase.auth.signOut();
      alert("Session expired or unauthorized. Please log in again.");
    }
  }, []);

  // ✅ Setup authentication listener (runs once)
  useEffect(() => {
    const setupAuth = async () => {
      setLoading(true);
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      const cachedProfile = localStorage.getItem("userProfile");

      if (cachedProfile) {
        setUserProfile(JSON.parse(cachedProfile));
      }

      if (initialSession?.user && !cachedProfile) {
        await fetchUserProfile(initialSession.user);
      }

      setSession(initialSession);
      setLoading(false);

      // ✅ Listen to login/logout events
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          await fetchUserProfile(newSession.user);
        } else {
          localStorage.removeItem("userProfile");
          setUserProfile(null);
        }
      });

      return () => subscription.unsubscribe();
    };

    setupAuth();
  }, [fetchUserProfile]);

  // ✅ Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("userProfile");
    setUserProfile(null);
    setSession(null);
  };

  const user = session?.user;
  const userRole = userProfile?.role;
  const userDepartment = userProfile?.department;
  const isAdmin = userRole === "admin";

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg font-medium text-gray-600">Loading...</div>
      </div>
    );

  return (
    <Router>
      {user && userRole && (
        <Sidebar onLogout={handleLogout} userRole={userRole} />
      )}

      <div
        className={
          user && userRole
            ? "ml-[250px] bg-gray-50 min-h-screen font-[system-ui]"
            : ""
        }
      >
        <Routes>
          {/* ✅ Public Routes */}
          <Route
            path="/login"
            element={
              !user ? <Login /> : <Navigate to={isAdmin ? "/home" : "/sheet"} />
            }
          />
          <Route
            path="/signup"
            element={!user ? <Register /> : <Navigate to="/home" />}
          />

          {/* ✅ Admin Routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute isAllowed={user && isAdmin}>
                <Homepage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analysis"
            element={
              <ProtectedRoute isAllowed={user && isAdmin}>
                <Analysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usermanagement"
            element={
              <ProtectedRoute isAllowed={user && isAdmin}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute isAllowed={user && isAdmin}>
                <Profile user={user} />
              </ProtectedRoute>
            }
          />

          {/* ✅ Common User Routes */}
          <Route
            path="/sheet"
            element={
              <ProtectedRoute isAllowed={user && userRole}>
                <Sheet userDepartment={userDepartment} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/data"
            element={
              <ProtectedRoute isAllowed={user && userRole}>
                <Data userRole={userRole} userDepartment={userDepartment} />
              </ProtectedRoute>
            }
          />

          {/* ✅ Default Route */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}
