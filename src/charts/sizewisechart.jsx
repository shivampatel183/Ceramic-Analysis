import React, { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../supabaseClient";
import { calculateFinalResult } from "../calculations/finalresult";
import { calculatePowderConsumption } from "../calculations/powder";
import { calculateGlazeConsumption } from "../calculations/glaze";
import { calculateFuelConsumption } from "../calculations/fuel";
import { calculateGasConsumption } from "../calculations/gas";
import { calculateElectricityCost } from "../calculations/electricity";
import { calculatePackingCost } from "../calculations/packing";
import { calculateFixedCost } from "../calculations/fixedcost";
import { calculateInkCost } from "../calculations/inkcost";
import {
  calculateProductionBySize,
  calculateNetProduction,
} from "../calculations/netProduction";

const COLORS = [
  "#4F46E5", // Indigo
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Amber
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#6B7280", // Gray
];

export default function FinalResultHistoryCard({ range }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const today = new Date();
        let days = 7;
        if (range === "day") days = 1;
        else if (range === "week") days = 7;
        else if (range === "month") days = 30;

        // 1. Create a map to hold data for each day in the range
        const dateMap = new Map();
        for (let i = 0; i < days; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const iso = d.toISOString().split("T")[0];
          dateMap.set(iso, []); // Initialize with empty array
        }

        // 2. Determine the start date for the Supabase query
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - days + 1);
        const startIso = startDate.toISOString().split("T")[0];

        // 3. Fetch all production data within the date range
        const { data: productionData, error } = await supabase
          .from("production_data")
          .select("*")
          .gte("date", startIso);

        if (error) throw error;

        // 4. Group the fetched data by date using the corrected date matching
        productionData.forEach((row) => {
          const rowDate = row.date.split("T")[0]; // Extract YYYY-MM-DD
          if (dateMap.has(rowDate)) {
            dateMap.get(rowDate).push(row);
          }
        });

        // 5. Process data for each day
        const history = [];
        for (const [date, dailyData] of dateMap.entries()) {
          // If a day has no production data, record an empty total object
          if (dailyData.length === 0) {
            history.push({ date: date, total: {} });
            continue;
          }

          // Run all calculations for that specific day's data
          const powder = calculatePowderConsumption(dailyData);
          const glaze = calculateGlazeConsumption(dailyData);
          const fuel = calculateFuelConsumption(dailyData);
          const gas = calculateGasConsumption(dailyData);
          const electricity = calculateElectricityCost(dailyData);
          const packing = calculatePackingCost(dailyData);
          const fixed = calculateFixedCost(dailyData);
          const ink = calculateInkCost(dailyData);
          const netProductionResult = calculateNetProduction(dailyData);
          const productionBySize = calculateProductionBySize(dailyData);

          // Calculate the final result summary for the day
          const finalResult = calculateFinalResult(
            powder,
            glaze,
            fuel,
            gas,
            electricity,
            packing,
            fixed,
            ink,
            productionBySize, // Pass size-specific production
            netProductionResult // Pass total production for the day
          );

          // Store the date and the 'Total' object (which contains size-wise totals)
          history.push({ date, total: finalResult?.Total ?? {} });
        }

        // 6. Sort history chronologically
        history.sort((a, b) => new Date(a.date) - new Date(b.date));
        setData(history); // Update state
      } catch (error) {
        console.error("Error fetching final result history:", error);
        setData([]); // Set empty data on error
      } finally {
        setLoading(false); // Stop loading indicator
      }
    }

    load(); // Run the async function
  }, [range]); // Re-run effect when the date range changes

  // Determine all unique sizes present in the data across the date range
  console.log("Final Result History Data:", data);
  const allSizes = useMemo(
    () =>
      Array.from(
        new Set(
          data.flatMap((entry) =>
            // Get keys from the 'total' object for each day, excluding the "Total" key itself
            Object.keys(entry.total || {}).filter((k) => k !== "Total")
          )
        )
      ).sort(), // Sort sizes alphabetically
    [data] // Recompute when data changes
  );

  // Create a mapping from size name to color for the chart lines
  const sizeColorMap = useMemo(() => {
    const map = {};
    allSizes.forEach((size, idx) => {
      map[size] = COLORS[idx % COLORS.length]; // Cycle through colors
    });
    return map;
  }, [allSizes]); // Recompute when sizes change

  // Transform the history data into the format required by the Recharts LineChart
  const chartData = useMemo(
    () =>
      data.map((entry) => {
        // Start with the date for the X-axis
        const row = { date: entry.date };
        // For each known size, add its total cost for that day to the row object
        allSizes.forEach((size) => {
          // Get the cost string (e.g., "123.45"), default to "0", then parse as float
          row[size] = parseFloat(entry.total[size] || "0");
        });
        return row;
      }),
    [data, allSizes] // Recompute when data or sizes change
  );

  // Display loading indicator while fetching/processing data
  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-2xl p-6 h-80 flex justify-center items-center">
        <p>Loading Chart...</p>
      </div>
    );
  }

  // Render the chart component
  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
      <h3 className="text-lg font-bold mb-4">Size-wise Total Cost History</h3>
      <div className="h-80">
        {" "}
        {/* Fixed height container for the chart */}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="date" /> {/* Date axis */}
            <YAxis /> {/* Cost axis */}
            <Tooltip /> {/* Show details on hover */}
            <Legend /> {/* Show size names and colors */}
            {/* Map through each size and create a Line component for it */}
            {allSizes.map((size) => (
              <Line
                key={size} // Unique key for React
                type="monotone" // Smooth line shape
                dataKey={size} // The key in chartData holding this size's cost
                name={size} // Name shown in legend and tooltip
                stroke={sizeColorMap[size]} // Color for this line
                strokeWidth={2}
                dot={false} // Don't show individual points on the line
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
