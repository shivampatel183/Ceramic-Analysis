import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

// A simple Modal component for editing
const EditUserModal = ({ user, onClose, onSave }) => {
  const [department, setDepartment] = useState(user.department || "");
  const [role, setRole] = useState(user.role || "");

  const handleSave = () => {
    onSave(user.id, { department, role });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Edit User: {user.email}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Department
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default function UserManagement() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [users, setUsers] = useState([]);
  const departmentOptions = ["Production", "Packaging", "Die(Color)", "Other"];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("list-users");
      if (error) throw error;
      setUsers(data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err.message);
      alert("Error fetching users: " + err.message);
      setUsers([]);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      // We now use the secure Edge Function to create the user
      const { error } = await supabase.functions.invoke("create-user", {
        body: { email, password, department },
      });
      if (error) throw new Error(error.message);

      alert("User created successfully!");
      setEmail("");
      setPassword("");
      setDepartment("");
      fetchUsers();
    } catch (err) {
      alert("Error creating user: " + err.message);
    }
  };

  // --- Delete Logic ---

  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm("Are you sure you want to permanently delete this user?")
    ) {
      return;
    }
    try {
      // Call the secure 'delete-user' Edge Function
      const { error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: userId },
      });

      if (error) throw new Error(error.message);

      // Optimistically update the UI
      setUsers(users.filter((user) => user.id !== userId));
      alert("User deleted successfully!");
    } catch (err) {
      alert("Error deleting user: " + err.message);
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <h2 className="text-2xl font-bold text-center mb-6 text-blue-700">
        User Management
      </h2>

      {/* Add New User Section */}
      <div className="mx-auto bg-white shadow-md rounded-xl p-8 mb-8">
        <h3 className="text-lg font-semibold text-indigo-700 border-b pb-2 mb-4">
          Add New User
        </h3>
        <form
          onSubmit={handleAddUser}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center"
        >
          <input
            type="email"
            placeholder="User Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          >
            <option value="" disabled>
              Select Department
            </option>
            {departmentOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-md transition"
          >
            Add User
          </button>
        </form>
      </div>

      {/* User List Section */}
      <div className="mx-auto bg-white shadow-md rounded-xl p-8">
        <h3 className="text-lg font-semibold text-indigo-700 border-b pb-2 mb-4">
          Users Created by You
        </h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-indigo-100 text-left">
              <th className="p-3 border">Email</th>
              <th className="p-3 border">Department</th>
              <th className="p-3 border">Role</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="p-3 border">{user.email}</td>
                <td className="p-3 border">{user.department}</td>
                <td className="p-3 border capitalize">{user.role}</td>
                <td className="p-3 border">
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:underline ml-4"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <p className="text-gray-500 text-sm text-center mt-4">
            No users found for this admin.
          </p>
        )}
      </div>
    </div>
  );
}
