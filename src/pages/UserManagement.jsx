import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function UserManagement() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- REVISED AND CORRECTED fetchUsers function ---
  const fetchUsers = async () => {
    try {
      // Securely call the 'list-users' Edge Function you created
      const { data, error } = await supabase.functions.invoke("list-users");

      if (error) {
        throw error;
      }

      // The function returns a JSON object with a 'users' key
      setUsers(data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err.message);
      alert("Error fetching users: " + err.message);
      setUsers([]); // reset on error
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    try {
      // NOTE: For enhanced security, you might consider moving this logic
      // to your 'create-user' Edge Function as well.
      // However, the current approach is functional.

      // Create new user
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (signUpError) throw signUpError;

      const newUserId = signUpData.user?.id;
      if (!newUserId) throw new Error("User ID not returned after signup.");

      // Get current admin info
      const {
        data: { user: adminUser },
        error: adminError,
      } = await supabase.auth.getUser();

      if (adminError) throw adminError;
      if (!adminUser) throw new Error("Admin not logged in.");

      // Insert into user_roles with department
      const { error: roleError } = await supabase.from("user_roles").insert([
        {
          user_id: newUserId,
          role: "user",
          department,
          created_by: adminUser.id,
        },
      ]);

      if (roleError) throw roleError;

      alert("User created successfully!");
      setEmail("");
      setPassword("");
      setDepartment("");
      fetchUsers(); // Refresh the user list
    } catch (err) {
      alert("Error creating user: " + err.message);
    }
  };

  // --- PLACEHOLDER FUNCTIONS ---
  // You have onClick handlers for these but they are not defined.
  // You will need to implement them.
  const handleEditUser = (userId) => {
    alert(`Edit functionality for user ${userId} is not yet implemented.`);
  };

  const handleDeleteUser = (userId) => {
    alert(`Delete functionality for user ${userId} is not yet implemented.`);
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
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
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
          <input
            type="text"
            placeholder="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
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
                    onClick={() => handleEditUser(user.id)}
                    className="text-indigo-600 hover:underline"
                  >
                    Edit
                  </button>
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
