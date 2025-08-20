import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";

export default function Analysis() {
  const [timeFilter, setTimeFilter] = useState("day");
  const [totalPowder, setTotalPowder] = useState(0);
  const [powderBySize, setPowderBySize] = useState({});

  // Body Cost mapping by size
  const bodyCostMap = {
    "600x600": 1.395,
    "200x1000": 1.395,
    "150x900": 1.395,
    "200x1200": 1.29,
    "400x400": 1.218,
  };

  useEffect(() => {
    const fetchPowderConsumption = async () => {
      let query = supabase.from("production_data").select("*");

      // Apply time filter
      const today = new Date();
      if (timeFilter === "day") {
        query = query.gte("date", today.toISOString().split("T")[0]);
      } else if (timeFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        query = query.gte("date", weekAgo.toISOString().split("T")[0]);
      } else if (timeFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        query = query.gte("date", monthAgo.toISOString().split("T")[0]);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching data:", error);
        return;
      }

      let total = 0;
      let sizeWise = {};

      data.forEach((row) => {
        const size = row.size;
        const press = row.press_box || 0;
        const green = row.green_box_weight || 0;
        const bodyCost = bodyCostMap[size] || 0;

        const consumption = press * green * 1.05 * bodyCost;

        total += consumption;
        sizeWise[size] = (sizeWise[size] || 0) + consumption;
      });

      setTotalPowder(total);
      setPowderBySize(sizeWise);
    };

    fetchPowderConsumption();
  }, [timeFilter]);

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight mb-4 md:mb-0">
          📊 Production Analysis
        </h1>

        {/* Time Filter Dropdown */}
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="text-sm font-medium border border-indigo-200 rounded px-4 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        >
          <option value="day">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Total Powder Consumption */}
        <Card className="shadow-lg hover:shadow-2xl transition rounded-2xl border-0 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Powder Consumption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-indigo-600">
              {totalPowder.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Kg (approx.)</p>
          </CardContent>
        </Card>

        {/* Powder Consumption by Size */}
        <Card className="shadow-lg hover:shadow-2xl transition rounded-2xl border-0 bg-white col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Powder Consumption by Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(powderBySize).length > 0 ? (
              <ul className="text-sm text-gray-700 divide-y divide-gray-100">
                {Object.entries(powderBySize).map(([size, value], i) => (
                  <li
                    key={size}
                    className={`flex justify-between py-2 px-2 rounded-lg ${
                      i % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } hover:bg-indigo-50 transition`}
                  >
                    <span className="font-medium">{size}</span>
                    <span className="font-bold text-indigo-600">
                      {value.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
