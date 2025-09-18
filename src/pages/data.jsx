import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import EditDialog from "../components/EditDialog";

// Helper to clone rows for optimistic updates
const cloneRows = (rows) => JSON.parse(JSON.stringify(rows));

// Helper to trigger a data refresh in other tabs/components
const triggerRefresh = () => {
  localStorage.setItem("refreshData", "true");
  // Dispatch storage event for other tabs
  window.dispatchEvent(new Event("storage"));
};

export default function DataTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editRow, setEditRow] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Delete handler with optimistic update
  const handleDelete = async (row) => {
    console.log("Attempting to delete row:", row);
    if (
      !window.confirm(
        `Are you sure you want to delete this record from ${row.date}?`
      )
    ) {
      return;
    }

    // Optimistic update
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
      // Revert optimistic update
      setRows(oldRows);
      alert("Failed to delete record. Please try again.");
    }
  };

  // Save handler for edit dialog
  const handleSave = async (updatedData) => {
    if (!updatedData.id) {
      alert("Cannot update: missing row ID");
      return;
    }

    setLoading(true);
    // Keep a copy for rollback
    const oldRows = cloneRows(rows);

    // Check if user is authenticated
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      alert("Please sign in to update records");
      setLoading(false);
      return;
    }

    try {
      // First verify the row exists
      const { data: existingRow, error: checkError } = await supabase
        .from("production_data")
        .select()
        .eq("id", updatedData.id)
        .single();

      if (checkError || !existingRow) {
        throw new Error("Row not found or access denied");
      }

      // Get the current user session
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to update records");
      }

      // Prepare the data for update - only include fields that should be updated
      const dataToUpdate = {
        id: updatedData.id, // Include the ID explicitly
        user_id: user.id, // Include the user_id for RLS
        date: updatedData.date
          ? new Date(updatedData.date).toISOString().split("T")[0]
          : null,
        size: updatedData.size,
        green_box_weight: parseFloat(updatedData.green_box_weight) || 0,
        press_box: parseFloat(updatedData.press_box) || 0,
        before_flow: parseFloat(updatedData.before_flow) || 0,
        kiln_entry_box: parseFloat(updatedData.kiln_entry_box) || 0,
        packing_box: parseFloat(updatedData.packing_box) || 0,
        fired_loss_box: parseFloat(updatedData.fired_loss_box) || 0,
        sizing_fire_loss_boxes:
          parseFloat(updatedData.sizing_fire_loss_boxes) || 0,
        spray_dryer_production:
          parseFloat(updatedData.spray_dryer_production) || 0,
        coal_units_use: parseFloat(updatedData.coal_units_use) || 0,
        daily_electricity_units_use:
          parseFloat(updatedData.daily_electricity_units_use) || 0,
        gas_consumption: parseFloat(updatedData.gas_consumption) || 0,
        pre_box: parseFloat(updatedData.pre_box) || 0,
        std_box: parseFloat(updatedData.std_box) || 0,
        eco_box: parseFloat(updatedData.eco_box) || 0,
        base: parseFloat(updatedData.base) || 0,
        brown: parseFloat(updatedData.brown) || 0,
        black: parseFloat(updatedData.black) || 0,
        blue: parseFloat(updatedData.blue) || 0,
        red: parseFloat(updatedData.red) || 0,
        yellow: parseFloat(updatedData.yellow) || 0,
        green: parseFloat(updatedData.green) || 0,
        maintenance: parseFloat(updatedData.maintenance) || 0,
        legal_illegal: parseFloat(updatedData.legal_illegal) || 0,
        office: parseFloat(updatedData.office) || 0,
        diesel: parseFloat(updatedData.diesel) || 0,
        general_freight: parseFloat(updatedData.general_freight) || 0,
        kiln_gap: parseFloat(updatedData.kiln_gap) || 0,
        commutative_kiln_gap: parseFloat(updatedData.commutative_kiln_gap) || 0,
        daily_unsizing_stock: parseFloat(updatedData.daily_unsizing_stock) || 0,
        body_cost: parseFloat(updatedData.body_cost) || 0,
      };

      // Remove any undefined or NaN values
      Object.keys(dataToUpdate).forEach((key) => {
        if (
          dataToUpdate[key] === undefined ||
          Number.isNaN(dataToUpdate[key])
        ) {
          delete dataToUpdate[key];
        }
      });

      console.log("Updating data for ID:", updatedData.id, dataToUpdate);

      // Update the row
      // First verify the row exists
      const { data: rowToUpdate } = await supabase
        .from("production_data")
        .select()
        .eq("id", updatedData.id)
        .single();

      if (!rowToUpdate) {
        throw new Error("Record not found");
      }

      // Perform the update using upsert
      const { data: updateResponse, error } = await supabase
        .from("production_data")
        .upsert(
          {
            id: updatedData.id, // Make sure to include the ID
            ...dataToUpdate,
          },
          {
            onConflict: "id",
          }
        )
        .select()
        .single();

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      if (!updateResponse) {
        throw new Error("No data returned from update");
      }

      // Log the successful update
      console.log("Update successful. New database state:", updateResponse);

      // Use the response directly since we used .single()
      const updatedRow = updateResponse;
      console.log("Processing update response:", updatedRow);

      // Update local state with the final data
      const newRows = rows.map((row) =>
        row.id === updatedData.id ? updatedRow : row
      );

      setRows(newRows);

      // Update cache
      localStorage.setItem(
        "production_data_cache",
        JSON.stringify({
          rows: newRows,
          timestamp: Date.now(),
        })
      );

      // Notify other components
      triggerRefresh();

      // Show success message
      alert("Record updated successfully!");

      // Close dialog
      setEditRow(null);
    } catch (err) {
      console.error("Failed to update:", err);
      // Revert to old state
      setRows(oldRows);
      alert(`Failed to update record: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch data that we can reuse
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("production_data")
        .select("*")
        .order("date", { ascending: false }); // Latest data first

      if (error) throw error;

      setRows(data || []);
      // Update cache with fresh data
      localStorage.setItem(
        "production_data_cache",
        JSON.stringify({
          rows: data || [],
          timestamp: Date.now(),
        })
      );
    } catch (err) {
      console.error("❌ Error fetching data:", err.message);
      alert("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []); // Empty deps for initial load

  // Listen for refresh events
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "refreshData" && e.newValue === "true") {
        fetchData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

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

  const columns = Object.keys(rows[0]).filter(
    (col) => col !== "user_id" && col !== "id"
  );

  const filteredRows = rows.filter((row) =>
    Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const sortedRows = [...filteredRows].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
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

        {/* 🔍 Search */}
        <div className="flex justify-end mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Table */}
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
              {sortedRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`transition-colors ${
                    rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"
                  } hover:bg-blue-50`}
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

        {/* Edit Dialog */}
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
