// src/charts/sizewisechart.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  "#4F46E5",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#6B7280",
];

// Helper function to get date range boundaries
const getDateRange = (range) => {
  const today = new Date();
  let days = 7; // Default to week
  if (range === "day") days = 1;
  else if (range === "week") days = 7;
  else if (range === "month") days = 30;

  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days + 1);
  const startIso = startDate.toISOString().split("T")[0];
  const endIso = today.toISOString().split("T")[0];

  // Generate all dates within the range for mapping
  const allDates = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    allDates.push(d.toISOString().split("T")[0]);
  }

  return { startIso, endIso, allDates };
};

// Helper function to fetch data
const fetchData = async (startIso) => {
  const prodPromise = supabase
    .from("production_data")
    .select("*")
    .gte("date", startIso);

  const settingsPromise = supabase.from("cost_settings_history").select("*"); // Fetch all history

  const [prodResult, settingsResult] = await Promise.all([
    prodPromise,
    settingsPromise,
  ]);

  if (prodResult.error) throw prodResult.error;
  if (settingsResult.error) throw settingsResult.error;

  return {
    productionData: prodResult.data || [],
    allCostHistory: settingsResult.data || [],
  };
};

// Helper function to process data for a single day
const processDailyData = (dailyData, allCostHistory) => {
  if (!dailyData || dailyData.length === 0) {
    return {}; // Return empty object if no data for the day
  }

  const powder = calculatePowderConsumption(dailyData, allCostHistory);
  const glaze = calculateGlazeConsumption(dailyData, allCostHistory);
  const fuel = calculateFuelConsumption(dailyData, allCostHistory);
  const gas = calculateGasConsumption(dailyData, allCostHistory);
  const electricity = calculateElectricityCost(dailyData, allCostHistory);
  const packing = calculatePackingCost(dailyData, allCostHistory);
  const fixed = calculateFixedCost(dailyData, allCostHistory);
  const ink = calculateInkCost(dailyData, allCostHistory);
  const netProductionResult = calculateNetProduction(dailyData);
  const productionBySize = calculateProductionBySize(dailyData);

  const finalResult = calculateFinalResult(
    powder,
    glaze,
    fuel,
    gas,
    electricity,
    packing,
    fixed,
    ink,
    productionBySize,
    netProductionResult
  );

  // Return only the 'Total' part needed for the chart
  return finalResult?.Total ?? {};
};

export default function FinalResultHistoryCard({ range }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use useCallback to memoize the load function
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { startIso, allDates } = getDateRange(range);
      const { productionData, allCostHistory } = await fetchData(startIso);

      // Group fetched data by date
      const dataByDate = productionData.reduce((acc, row) => {
        const date = row.date.split("T")[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(row);
        return acc;
      }, {});

      // Process data for each day in the required range
      const history = allDates.map((date) => {
        const dailyData = dataByDate[date] || []; // Get data for the date or empty array
        const processedTotal = processDailyData(dailyData, allCostHistory);
        return { date, total: processedTotal };
      });

      // Sort history chronologically before setting state
      history.sort((a, b) => new Date(a.date) - new Date(b.date));
      setData(history);
    } catch (error) {
      console.error("Error fetching or processing chart data:", error);
      setData([]); // Set empty data on error
    } finally {
      setLoading(false);
    }
  }, [range]); // Depend only on range

  useEffect(() => {
    load(); // Run the load function
  }, [load]); // Re-run effect when the memoized load function changes (i.e., when range changes)

  // Memoize calculation for all unique sizes present in the data
  const allSizes = useMemo(
    () =>
      Array.from(
        new Set(
          data.flatMap(
            (entry) =>
              Object.keys(entry.total || {}).filter((k) => k !== "Total") // Exclude potential "Total" key within daily totals
          )
        )
      ).sort(),
    [data]
  );

  // Memoize mapping from size name to color
  const sizeColorMap = useMemo(() => {
    const map = {};
    allSizes.forEach((size, idx) => {
      map[size] = COLORS[idx % COLORS.length];
    });
    return map;
  }, [allSizes]);

  // Memoize transformation of history data into chart format
  const chartData = useMemo(
    () =>
      data.map((entry) => {
        const row = { date: entry.date };
        allSizes.forEach((size) => {
          // Ensure value is a number, default to 0 if missing or invalid
          row[size] = parseFloat(entry.total[size] || "0") || 0;
        });
        return row;
      }),
    [data, allSizes]
  );

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-2xl p-6 h-80 flex justify-center items-center">
        <p>Loading Chart...</p>
      </div>
    );
  }

  // Check if there's actually data to display after loading
  const hasData = chartData.length > 0 && allSizes.length > 0;

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
      <h3 className="text-lg font-bold mb-4">Size-wise Total Cost History</h3>
      <div className="h-80">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `₹ ${value.toFixed(2)}`} />
              <Legend />
              {allSizes.map((size) => (
                <Line
                  key={size}
                  type="monotone"
                  dataKey={size}
                  name={size}
                  stroke={sizeColorMap[size]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls // Connect line even if a day has no data for this size
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">
              No data available for the selected period.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
