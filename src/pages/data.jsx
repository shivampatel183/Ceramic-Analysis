import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../supabaseClient";
import EditDialog from "../components/EditDialog";
import Toast from "../components/Toast.jsx";
import { Search, Edit, Trash2, Loader2 } from "lucide-react";

// Defines which columns are relevant for each department.
const departmentColumns = {
  Production: [
    "id",
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
  Packaging: [
    "id",
    "date",
    "size",
    "packing_box",
    "pre_box",
    "std_box",
    "eco_box",
  ],
  "Die(Color)": [
    "id",
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
    "id",
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

// A utility function to format dates consistently.
const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  // Adjust for timezone offset to display the correct date
  const userTimezoneOffset = d.getTimezoneOffset() * 60000;
  const correctedDate = new Date(d.getTime() + userTimezoneOffset);
  return correctedDate.toLocaleDateString("en-GB"); // DD/MM/YYYY format
};

export default function DataTable({ userRole, userDepartment }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editRow, setEditRow] = useState(null);
  const [notification, setNotification] = useState(null);

  // Optimized data fetching function wrapped in useCallback for stability.
  const fetchData = useCallback(async () => {
    if (!userRole || !userDepartment) return;
    setLoading(true);

    try {
      // Determine which columns to select based on user role.
      // Non-admins only fetch columns relevant to their department.
      const columnsToSelect =
        userRole !== "admin" && departmentColumns[userDepartment]
          ? departmentColumns[userDepartment].join(",")
          : "*";

      const { data, error } = await supabase
        .from("production_data")
        .select(columnsToSelect)
        .order("date", { ascending: false });

      if (error) throw error;

      setRows(data || []);
    } catch (err) {
      console.error("❌ Error fetching data:", err.message);
      setNotification({
        type: "error",
        message: "Failed to load data. Please refresh.",
      });
    } finally {
      setLoading(false);
    }
  }, [userRole, userDepartment]);

  // Initial data fetch and re-fetch when user details change.
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-fetch data when the browser tab becomes visible again to ensure data is fresh.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchData]);

  const handleDelete = async (rowToDelete) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this record from ${formatDate(
          rowToDelete.date
        )}?`
      )
    )
      return;

    const originalRows = [...rows];
    setRows(rows.filter((r) => r.id !== rowToDelete.id));
    setNotification({ type: "success", message: "Record deleted." });

    try {
      const { error } = await supabase
        .from("production_data")
        .delete()
        .match({ id: rowToDelete.id });
      if (error) throw error;
    } catch (err) {
      setNotification({
        type: "error",
        message: "Failed to delete. Restoring data.",
      });
      setRows(originalRows); // Restore rows on failure
    }
  };

  const handleSave = async (updatedData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("production_data")
        .update(updatedData)
        .eq("id", updatedData.id);

      if (error) throw error;

      await fetchData(); // Re-fetch to show updated data
      setNotification({
        type: "success",
        message: "Record updated successfully!",
      });
      setEditRow(null);
    } catch (err) {
      setNotification({
        type: "error",
        message: `Update failed: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Memoized calculation for table columns.
  const columns = useMemo(() => {
    if (rows.length === 0) return [];
    // Dynamically generate columns from the fetched data keys.
    return Object.keys(rows[0]).filter(
      (col) => !["id", "user_id", "created_at"].includes(col)
    );
  }, [rows]);

  // Memoized calculation for filtered rows based on search input.
  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        Object.values(row)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [rows, search]
  );

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8">
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(null)}
        />
      )}
      <div className="mx-auto bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-xl font-bold text-gray-800">Production Data</h1>
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-semibold text-gray-700">
              No Data Found
            </h3>
            <p className="text-gray-500 mt-2">
              {search
                ? "Try adjusting your search term."
                : "Go to the Entry page to add new data."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[75vh]">
            <table className="min-w-full w-full border-collapse table-auto text-sm">
              <thead className="bg-slate-100 sticky top-0 z-10">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 font-semibold text-left text-slate-600 capitalize border-b border-slate-200"
                    >
                      {col.replace(/_/g, " ")}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold text-right text-slate-600 border-b border-slate-200 sticky right-0 bg-slate-100">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="px-4 py-3 text-slate-700 whitespace-nowrap"
                      >
                        {col === "date"
                          ? formatDate(row[col])
                          : row[col] ?? "-"}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right sticky right-0 bg-white group-hover:bg-slate-50 transition-colors">
                      {/* --- THIS IS THE FIX --- */}
                      {userRole === "admin" ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditRow(row)}
                            className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(row)}
                            className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs px-2">
                          No Actions
                        </span>
                      )}
                      {/* --- END OF FIX --- */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <EditDialog
        open={Boolean(editRow)}
        onClose={() => setEditRow(null)}
        row={editRow}
        onSave={handleSave}
      />
    </div>
  );
}
