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
import { fetchProductionBySize } from "../calculations/netProduction";

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

export default function SizewiseGroupedBarChart({ range = "week" }) {
  // Renamed for clarity
  const [data, setData] = useState([]);
  const [allSizes, setAllSizes] = useState([]);

  useEffect(() => {
    async function load() {
      // Fetch production by size for the selected range
      const today = new Date();
      let days = 7;
      if (range === "day") days = 1;
      else if (range === "week") days = 7;
      else if (range === "month") days = 30;
      else if (range === "all") days = 90; // Consider a larger number for "all" or remove it if not needed

      const startDate = new Date(today);
      startDate.setDate(today.getDate() - days + 1);
      const startIso = startDate.toISOString().split("T")[0];
      const rangeFilter = (query) => query.gte("date", startIso);

      // fetchProductionBySize expects (filter, applyDateFilter)
      const sizeData = await fetchProductionBySize(range, rangeFilter);

      // Group by date
      const grouped = {};
      const sizesSet = new Set();
      sizeData.forEach((row) => {
        sizesSet.add(row.size);
        if (!grouped[row.date]) grouped[row.date] = {};
        grouped[row.date][row.size] = row.total;
      });

      const allSizesArr = Array.from(sizesSet).sort();
      setAllSizes(allSizesArr);

      // Build chart data
      const chartData = Object.entries(grouped).map(([date, sizeObj]) => {
        const row = { date };
        allSizesArr.forEach((size) => {
          row[size] = sizeObj[size] || 0;
        });
        return row;
      });

      // Sort by date ascending
      chartData.sort((a, b) => new Date(a.date) - new Date(b.date));
      setData(chartData);
    }
    load();
  }, [range]);

  // Consistent color mapping for sizes (must be in render scope)
  const sizeColorMap = {};
  allSizes.forEach((size, idx) => {
    sizeColorMap[size] = COLORS[idx % COLORS.length];
  });

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 ">
      <h3 className="text-lg font-bold mb-4">Size-wise Production (Grouped)</h3>{" "}
      {/* Updated title */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barCategoryGap="10%" // Adjust gap between groups of bars
            barGap={2} // Adjust gap between bars within a group
          >
            <XAxis dataKey={"date"} />
            <YAxis />
            <Tooltip />
            <Legend />
            {allSizes.map((size) => (
              <Bar
                key={size}
                dataKey={size}
                // Removed stackId="a" to make them grouped instead of stacked
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
