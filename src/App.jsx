import React, { useEffect, useState } from "react";
import { Home, BarChart3, Database, User, LogOut } from "lucide-react";
import {
  BrowserRouter as Router,
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

const Sidebar = ({ onLogout, userId }) => (
  <div className="fixed top-0 left-0 h-screen w-[250px] backdrop-blur-md bg-white/30 border-r border-gray-200 text-gray-900 flex flex-col px-6 py-8 shadow-md z-50 font-[system-ui]">
    <h2 className="text-2xl font-bold mb-10 tracking-tight text-blue-600">
      Ceramic Cost Calculator
    </h2>

    <nav className="flex flex-col gap-3 text-[15px]">
      <NavLink
        to="/home"
        className={({ isActive }) =>
          `flex items-center gap-3 p-2 rounded-lg transition 
           ${
             isActive
               ? "bg-blue-200 text-blue-700"
               : "hover:bg-blue-100 hover:text-blue-600"
           }`
        }
      >
        <Home size={18} /> Home
      </NavLink>

      <NavLink
        to="/sheet"
        className={({ isActive }) =>
          `flex items-center gap-3 p-2 rounded-lg transition 
           ${
             isActive
               ? "bg-blue-200 text-blue-700"
               : "hover:bg-blue-100 hover:text-blue-600"
           }`
        }
      >
        <BarChart3 size={18} /> Entry
      </NavLink>

      <NavLink
        to="/data"
        className={({ isActive }) =>
          `flex items-center gap-3 p-2 rounded-lg transition 
           ${
             isActive
               ? "bg-blue-200 text-blue-700"
               : "hover:bg-blue-100 hover:text-blue-600"
           }`
        }
      >
        <Database size={18} /> Data
      </NavLink>

      <NavLink
        to="/analysis"
        className={({ isActive }) =>
          `flex items-center gap-3 p-2 rounded-lg transition 
           ${
             isActive
               ? "bg-blue-200 text-blue-700"
               : "hover:bg-blue-100 hover:text-blue-600"
           }`
        }
      >
        <BarChart3 size={18} /> Analysis
      </NavLink>
      <NavLink
        to="/usermanagement"
        className={({ isActive }) =>
          `flex items-center gap-3 p-2 rounded-lg transition 
           ${
             isActive
               ? "bg-blue-200 text-blue-700"
               : "hover:bg-blue-100 hover:text-blue-600"
           }`
        }
      >
        <User size={18} /> User Management
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex items-center gap-3 p-2 rounded-lg transition 
           ${
             isActive
               ? "bg-blue-200 text-blue-700"
               : "hover:bg-blue-100 hover:text-blue-600"
           }`
        }
      >
        <User size={18} /> Profile
      </NavLink>
    </nav>

    <button
      onClick={onLogout}
      className="mt-auto flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm py-2 rounded-lg shadow transition"
    >
      <LogOut size={16} /> Logout
    </button>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setUserId(session?.user?.id ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setUserId(session?.user?.id ?? null);
      }
    );

    return () => listener?.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return null;

  return (
    <Router>
      {user && <Sidebar onLogout={handleLogout} userId={userId} />}
      <div
        className={
          user ? "ml-[250px] bg-gray-50 min-h-screen font-[system-ui]" : ""
        }
      >
        <Routes>
          <Route
            path="/login"
            element={
              !user ? <Login setUser={setUser} /> : <Navigate to="/home" />
            }
          />
          <Route
            path="/signup"
            element={
              !user ? <Register setUser={setUser} /> : <Navigate to="/home" />
            }
          />
          <Route
            path="/home"
            element={user ? <Homepage /> : <Navigate to="/login" />}
          />
          <Route
            path="/sheet"
            element={user ? <Sheet /> : <Navigate to="/login" />}
          />
          <Route
            path="/profile"
            element={user ? <Profile user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/data"
            element={user ? <Data /> : <Navigate to="/login" />}
          />
          <Route
            path="/analysis"
            element={user ? <Analysis /> : <Navigate to="/login" />}
          />
          <Route
            path="/"
            element={<Navigate to={user ? "/home" : "/login"} />}
          />
        </Routes>
      </div>
    </Router>
  );
}
