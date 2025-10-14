import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../supabaseClient"; // Import supabase
import { calculateProductionBySize } from "../calculations/netProduction"; // Import the new calculation function

const COLORS = [
  "#4F46E5",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#3B82F6",
  "#8B5CF6",
  "#FFBB28",
  "#FF8042",
  "#A020F0",
  "#FF6384",
  "#36A2EB",
  "#4BC0C0",
];

export default function SizewiseStackedBarChart({ range = "week" }) {
  const [data, setData] = useState([]);
  const [allSizes, setAllSizes] = useState([]);
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

        const startDate = new Date(today);
        startDate.setDate(today.getDate() - days + 1);
        const startIso = startDate.toISOString().split("T")[0];

        // 1. Fetch the raw data directly
        const { data: productionData, error } = await supabase
          .from("production_data")
          .select("*")
          .gte("date", startIso);

        if (error) throw error;

        if (!productionData || productionData.length === 0) {
          setData([]);
          setAllSizes([]);
          return;
        }

        // 2. Use the pure calculation function
        const sizeData = calculateProductionBySize(productionData);

        const grouped = {};
        const sizesSet = new Set();
        sizeData.forEach((row) => {
          sizesSet.add(row.size);
          // Assuming one entry per day/size from the calculation result
          const date = productionData.find((p) => p.size === row.size)?.date; // Find corresponding date
          if (date) {
            if (!grouped[date]) grouped[date] = {};
            grouped[date][row.size] = row.total;
          }
        });

        const allSizesArr = Array.from(sizesSet).sort();
        setAllSizes(allSizesArr);

        const chartData = Object.entries(grouped).map(([date, sizeObj]) => {
          const row = { date };
          allSizesArr.forEach((size) => {
            row[size] = sizeObj[size] || 0;
          });
          return row;
        });

        chartData.sort((a, b) => new Date(a.date) - new Date(b.date));
        setData(chartData);
      } catch (err) {
        console.error("Error loading stacked bar chart data:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [range]);

  const sizeColorMap = {};
  allSizes.forEach((size, idx) => {
    sizeColorMap[size] = COLORS[idx % COLORS.length];
  });

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-2xl p-6 h-96 flex justify-center items-center">
        <p>Loading Chart...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
      <h3 className="text-lg font-bold mb-4">Size-wise Production</h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="10%" barGap={2}>
            <XAxis dataKey={"date"} />
            <YAxis />
            <Tooltip />
            <Legend />
            {allSizes.map((size) => (
              <Bar
                key={size}
                dataKey={size}
                fill={sizeColorMap[size]}
                name={size}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
