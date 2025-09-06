import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function DataTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from("production_data")
          .select("*");
        if (error) throw error;
        console.log("✅ Supabase data:", data);
        setRows(data || []);
      } catch (err) {
        console.error("❌ Error fetching data:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  // ✅ get columns (remove id, user_id)
  const columns = Object.keys(rows[0]).filter(
    (col) => col !== "user_id" && col !== "id"
  );

  // ✅ filter rows by search
  const filteredRows = rows.filter((row) =>
    Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase())
  );

  // ✅ sort by date
  const sortedRows = [...filteredRows].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // ✅ helper to format date
  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d)) return value; // if not valid date, return as-is
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`; // DD-MM-YYYY
  };

  return (
    <div className=" bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-700">
          Production Data Table
        </h2>

        {/* 🔍 Search */}
        <div className="flex justify-end mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="min-w-full border-collapse">
            <thead className="bg-blue-600 text-white sticky top-0 z-10">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-sm font-semibold text-left border-b border-gray-200 min-w-[100px]"
                  >
                    {col.replace(/_/g, " ")}
                  </th>
                ))}
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
                      className="px-6 py-3 text-sm border-b border-gray-200 min-w-[150px] whitespace-nowrap"
                    >
                      {col === "date"
                        ? formatDate(row[col])
                        : row[col] !== null
                        ? row[col]
                        : "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
