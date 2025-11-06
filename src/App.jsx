import React, { useEffect, useState, useCallback } from "react";
import {
  Home,
  BarChart3,
  Database,
  User,
  LogOut,
  Loader2,
  Settings,
} from "lucide-react";
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
import Fixedcost from "./pages/Fixedcost";
import ResetPassword from "./pages/ResetPassword.jsx";
const Sidebar = ({ onLogout, userRole }) => (
  <aside className="fixed top-0 left-0 h-screen w-[250px] bg-white border-r border-slate-200 flex flex-col p-6 shadow-sm z-50">
    <h2 className="text-2xl font-bold mb-10 tracking-tight text-indigo-600">
      Ceramic Analysis
    </h2>
    <nav className="flex flex-col gap-3 text-sm">
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
          <NavItem
            to="/fixedcost"
            icon={<Settings size={18} />}
            label="Fixed Cost"
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
      className="mt-auto flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-lg shadow-sm transition"
    >
      <LogOut size={16} /> Logout
    </button>
  </aside>
);

const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 p-2.5 rounded-lg font-medium transition-colors ${
        isActive
          ? "bg-indigo-100 text-indigo-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`
    }
  >
    {icon} {label}
  </NavLink>
);

const ProtectedRoute = ({ isAllowed, redirectPath = "/login", children }) =>
  !isAllowed ? <Navigate to={redirectPath} replace /> : children;

export default function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (user) => {
    if (!user) {
      setUserProfile(null);
      return;
    }
    try {
      const { data, error, status } = await supabase
        .from("user_roles")
        .select("role, department")
        .eq("user_id", user.id)
        .single();
      if (error && status !== 406) throw error;
      if (data) setUserProfile(data);
    } catch (err) {
      console.error("Error fetching user role:", err.message);
      setUserProfile(null);
    }
  }, []);

  // Central function to check and set the session state
  const checkSession = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setSession(session);
    await fetchUserProfile(session?.user);
    setLoading(false); // Always stop loading after a check
  }, [fetchUserProfile]);

  useEffect(() => {
    // Check session on initial load
    checkSession();

    // Set up a listener for auth changes (login, logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      fetchUserProfile(session?.user);
      if (!session) {
        setUserProfile(null);
      }
    });

    // *** FIX IS HERE: Add event listener for tab visibility ***
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Re-check the session when the tab becomes visible again
        checkSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription?.unsubscribe();
      // Clean up the visibility listener
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkSession, fetchUserProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const user = session?.user;
  const userRole = userProfile?.role;
  const userDepartment = userProfile?.department;
  const isAdmin = userRole === "admin";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-500" size={48} />
          <p className="text-lg text-gray-600">Loading Application...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {user && userRole && (
        <Sidebar onLogout={handleLogout} userRole={userRole} />
      )}
      <main
        className={
          user && userRole ? "ml-[250px] bg-slate-50 min-h-screen" : ""
        }
      >
        <Routes>
          <Route
            path="/login"
            element={
              !user ? <Login /> : <Navigate to={isAdmin ? "/home" : "/sheet"} />
            }
          />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* <Route
            path="/signup"
            element={!user ? <Register /> : <Navigate to="/login" />}
          /> */}
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
            path="/fixedcost"
            element={
              <ProtectedRoute isAllowed={user && isAdmin}>
                <Fixedcost />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute isAllowed={user && userRole}>
                <Profile user={user} />
              </ProtectedRoute>
            }
          />
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

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </main>
    </Router>
  );
}
