import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const ALL_FIELDS = [
  "date",
  "size",
  "green_box_weight",
  "press_box",
  "before_flow",
  "kiln_entry_box",
  "fired_loss_box",
  "sizing_fire_loss_boxes",
  "spray_dryer_production",
  "coal_units_use",
  "daily_electricity_units_use",
  "gas_consumption",
  "packing_box",
  "pre_box",
  "std_box",
  "eco_box",
  "base",
  "brown",
  "black",
  "blue",
  "red",
  "yellow",
  "green",
  "maintenance",
  "legal_illegal",
  "office",
  "diesel",
  "general_freight",
  "kiln_gap",
  "commutative_kiln_gap",
  "daily_unsizing_stock",
  "body_cost",
];

export default function UserManagement() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error("Error fetching users:", error);
      return;
    }

    const { data: permissionsData, error: permissionsError } = await supabase
      .from("user_permissions")
      .select("*");

    if (permissionsError) {
      console.error("Error fetching permissions:", permissionsError);
    } else {
      const perms = permissionsData.reduce((acc, p) => {
        acc[p.user_id] = p.allowed_fields;
        return acc;
      }, {});
      setPermissions(perms);
    }
    setUsers(users);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      alert("Error creating user: " + error.message);
    } else {
      alert("User created successfully! You can now assign permissions.");
      setEmail("");
      setPassword("");
      fetchUsers(); // Refresh the user list
    }
  };

  const handlePermissionChange = (userId, field) => {
    const currentPermissions = permissions[userId] || [];
    const newPermissions = currentPermissions.includes(field)
      ? currentPermissions.filter((f) => f !== field)
      : [...currentPermissions, field];

    setPermissions({ ...permissions, [userId]: newPermissions });
  };

  const handleSavePermissions = async (userId) => {
    const userPermissions = permissions[userId] || [];
    const { error } = await supabase
      .from("user_permissions")
      .upsert(
        { user_id: userId, allowed_fields: userPermissions },
        { onConflict: "user_id" }
      );

    if (error) {
      alert("Error saving permissions: " + error.message);
    } else {
      alert("Permissions saved successfully!");
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <h2 className="text-2xl font-bold text-center mb-6 text-blue-700">
        User Management
      </h2>

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
            placeholder="Email"
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
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-md transition"
          >
            Add User
          </button>
        </form>
      </div>

      <div className="mx-auto bg-white shadow-md rounded-xl p-8">
        <h3 className="text-lg font-semibold text-indigo-700 border-b pb-2 mb-4">
          User Permissions
        </h3>
        <div className="space-y-6">
          {users.map((user) => (
            <div key={user.id}>
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">{user.email}</h4>
                <button
                  onClick={() => handleSavePermissions(user.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg shadow-md transition text-sm"
                >
                  Save Permissions
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
                {ALL_FIELDS.map((field) => (
                  <label
                    key={field}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={(permissions[user.id] || []).includes(field)}
                      onChange={() => handlePermissionChange(user.id, field)}
                    />
                    <span>{field.replace(/_/g, " ")}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
