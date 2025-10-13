import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import EditDialog from "../components/EditDialog";

// Helper to clone rows for optimistic updates
const cloneRows = (rows) => JSON.parse(JSON.stringify(rows));

// Helper to trigger a data refresh in other tabs/components
const triggerRefresh = () => {
  localStorage.setItem("refreshData", "true");
  window.dispatchEvent(new Event("storage"));
};

// --- Define which columns each department can see ---
const departmentColumns = {
  Production: [
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
  ],
  Packaging: ["date", "size", "packing_box", "pre_box", "std_box", "eco_box"],
  "Die(Color)": [
    "date",
    "size",
    "base",
    "brown",
    "black",
    "blue",
    "red",
    "yellow",
    "green",
  ],
  Other: [
    "date",
    "size",
    "maintenance",
    "legal_illegal",
    "office",
    "diesel",
    "general_freight",
    "kiln_gap",
    "commutative_kiln_gap",
    "daily_unsizing_stock",
    "body_cost",
  ],
};

export default function DataTable({ userRole, userDepartment }) {
  // Accept props
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editRow, setEditRow] = useState(null);

  // Function to fetch data that we can reuse
  const fetchData = async () => {
    setLoading(true);
    try {
      // Determine which columns to select based on user role and department
      let columnsToSelect = "*"; // Default for admin
      if (
        userRole !== "admin" &&
        userDepartment &&
        departmentColumns[userDepartment]
      ) {
        // For regular users, build a specific select string
        // Always include 'id' for keying and editing purposes
        columnsToSelect = "id," + departmentColumns[userDepartment].join(",");
      }

      const { data, error } = await supabase
        .from("production_data")
        .select(columnsToSelect) // Dynamically select columns
        .order("date", { ascending: false });

      if (error) throw error;

      setRows(data || []);
    } catch (err) {
      console.error("❌ Error fetching data:", err.message);
      alert("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole && userDepartment) {
      fetchData();
    }
  }, [userRole, userDepartment]); // Refetch when role/department is available

  // Listen for refresh events from other components (like the Sheet page)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "refreshData" && e.newValue === "true") {
        fetchData();
        localStorage.removeItem("refreshData"); // Clean up the flag
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [userRole, userDepartment]); // Re-attach listener if props change

  // --- All other functions (handleDelete, handleSave) remain the same ---
  const handleDelete = async (row) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this record from ${row.date}?`
      )
    ) {
      return;
    }
    const oldRows = cloneRows(rows);
    setRows(rows.filter((r) => r.id !== row.id));
    try {
      const { error } = await supabase
        .from("production_data")
        .delete()
        .match({ id: row.id });
      if (error) throw error;
      triggerRefresh();
    } catch (err) {
      console.error("Failed to delete:", err);
      setRows(oldRows);
      alert("Failed to delete record. Please try again.");
    }
  };

  const handleSave = async (updatedData) => {
    if (!updatedData.id) {
      alert("Cannot update: missing row ID");
      return;
    }
    setLoading(true);
    const oldRows = cloneRows(rows);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to update records");

      const { error } = await supabase
        .from("production_data")
        .update(updatedData)
        .eq("id", updatedData.id)
        .select()
        .single();
      if (error) throw error;

      // Manually refetch the data to get the updated row with the correct columns
      fetchData();
      triggerRefresh();
      alert("Record updated successfully!");
      setEditRow(null);
    } catch (err) {
      console.error("Failed to update:", err);
      setRows(oldRows);
      alert(`Failed to update record: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-gray-600">Loading data...</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-gray-600">No data found</p>
      </div>
    );
  }

  // Dynamically generate columns from the first row of the fetched data
  const columns = Object.keys(rows[0]).filter(
    (col) => col !== "id" && col !== "user_id"
  );

  const filteredRows = rows.filter((row) =>
    Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const sortedRows = [...filteredRows].sort(
    (a, b) => new Date(b.date) - new Date(a.date) // Sort descending (newest first)
  );

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d)) return value;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen p-2 sm:p-6">
      <div className="mx-auto bg-white rounded-xl shadow-lg p-3 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 text-blue-700">
          Production Data Table
        </h2>

        <div className="flex justify-end mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="overflow-x-auto max-h-[70vh]">
          <table className="min-w-full w-full border-collapse table-auto">
            <thead className="bg-blue-600 text-white sticky top-0 z-10">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-left border-b border-gray-200 min-w-[120px] sm:min-w-[150px]"
                  >
                    {col.replace(/_/g, " ")}
                  </th>
                ))}
                <th
                  className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-left border-b border-gray-200 sticky right-0 bg-blue-600"
                  style={{ minWidth: "100px" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors odd:bg-white even:bg-gray-50 hover:bg-blue-50"
                >
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm border-b border-gray-200 min-w-[120px] sm:min-w-[150px] break-words"
                    >
                      {col === "date"
                        ? formatDate(row[col])
                        : row[col] !== null
                        ? row[col]
                        : "-"}
                    </td>
                  ))}
                  <td className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm border-b border-gray-200 sticky right-0 bg-inherit">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditRow(row)}
                        className="p-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                        title="Edit"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(row)}
                        className="p-1 text-red-600 hover:text-red-800 focus:outline-none"
                        title="Delete"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <EditDialog
          open={Boolean(editRow)}
          onClose={() => setEditRow(null)}
          row={editRow}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
