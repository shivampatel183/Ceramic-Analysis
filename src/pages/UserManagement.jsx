import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Plus, Trash2, Edit, X, Loader2 } from "lucide-react";
import Toast from "../components/Toast.jsx";

const EditUserModal = ({ user, onClose, onSave }) => {
  const [department, setDepartment] = useState(user.department || "");
  const [role, setRole] = useState(user.role || "");

  const handleSave = () => {
    onSave(user.id, { department, role });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Edit User</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Editing profile for:{" "}
          <span className="font-medium text-slate-700">{user.email}</span>
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Department
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    department: "",
  });

  const departmentOptions = ["Production", "Packaging", "Die(Color)", "Other"];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("list-users");
      if (error) throw error;
      setUsers(data.users || []);
    } catch (err) {
      setNotification({
        type: "error",
        message: "Error fetching users: " + err.message,
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("create-user", {
        body: newUser,
      });
      if (error) throw new Error(error.message);
      setNotification({
        type: "success",
        message: "User created successfully!",
      });
      setNewUser({ email: "", password: "", department: "" });
      fetchUsers();
    } catch (err) {
      setNotification({
        type: "error",
        message: "Error creating user: " + err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm("Are you sure you want to permanently delete this user?")
    )
      return;
    try {
      setUsers(users.filter((user) => user.id !== userId));
      const { error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: userId },
      });
      if (error) throw new Error(error.message);
      setNotification({
        type: "success",
        message: "User deleted successfully!",
      });
    } catch (err) {
      setNotification({
        type: "error",
        message: "Error deleting user: " + err.message,
      });
      fetchUsers(); // Re-fetch to get correct state
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(null)}
        />
      )}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-800">User Management</h1>
        <p className="text-gray-500 mt-1">
          Add, view, and manage department users.
        </p>
      </div>

      {/* Add New User Section */}
      <div className="bg-white shadow-md rounded-xl p-6 sm:p-8 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          Add New User
        </h3>
        <form
          onSubmit={handleAddUser}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end"
        >
          <input
            type="email"
            placeholder="User Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            className="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-1.5"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
            className="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-1.5"
            required
          />
          <select
            value={newUser.department}
            onChange={(e) =>
              setNewUser({ ...newUser, department: e.target.value })
            }
            className="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-1.5"
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
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-sm transition flex items-center justify-center gap-2 disabled:bg-indigo-400"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Plus size={20} />
            )}{" "}
            Add User
          </button>
        </form>
      </div>

      {/* User List Section */}
      <div className="bg-white shadow-md rounded-xl p-6 sm:p-8">
        <h1 className="text-xl font-bold text-gray-800">Managed Users</h1>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : users.length === 0 ? (
          <p className="text-gray-500 text-center py-10">
            No users have been created yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 font-semibold text-left text-slate-600 border-b">
                    Email
                  </th>
                  <th className="p-3 font-semibold text-left text-slate-600 border-b">
                    Department
                  </th>
                  <th className="p-3 font-semibold text-left text-slate-600 border-b">
                    Role
                  </th>
                  <th className="p-3 font-semibold text-right text-slate-600 border-b">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-700 font-medium">
                      {user.email}
                    </td>
                    <td className="p-3 text-slate-700">{user.department}</td>
                    <td className="p-3 text-slate-700 capitalize">
                      {user.role}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button
                          disabled
                          className="p-2 text-gray-400 cursor-not-allowed"
                          title="Edit (Coming Soon)"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
