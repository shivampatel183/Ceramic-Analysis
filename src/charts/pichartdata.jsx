import React, { useEffect, useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchFinalResult } from "../calculations/finalresult";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A020F0",
  "#FF6384",
  "#36A2EB",
  "#4BC0C0",
];

export default function CostBreakdownPie({ range = "week" }) {
  const [data, setData] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [trendData, setTrendData] = useState([]);
  const [selectedCost, setSelectedCost] = useState("");
  // Drill-down: fetch cost trend for selected cost
  async function handleSliceClick(costName) {
    setSelectedCost(costName);
    setModalOpen(true);
    // Fetch trend for last 30 days
    const today = new Date();
    const trend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const rangeFilter = (query) =>
        query.gte("date", dateStr).lte("date", dateStr);
      const res = await fetchFinalResult("day", rangeFilter);
      trend.push({
        date: dateStr,
        value: parseFloat(res?.[costName]?.Total || 0),
      });
    }
    setTrendData(trend);
  }

  useEffect(() => {
    const cacheKey = `costBreakdownPie_${range}`;
    const refreshFlag = localStorage.getItem("refreshData");
    if (refreshFlag === "true") {
      localStorage.removeItem(cacheKey);
      localStorage.setItem("refreshData", "false");
    }
    const cache = localStorage.getItem(cacheKey);
    if (cache && refreshFlag !== "true") {
      try {
        const parsed = JSON.parse(cache);
        setData(parsed.data || []);
        return;
      } catch (e) {}
    }
    const loadData = async () => {
      try {
        const today = new Date();
        let days = 7;
        if (range === "day") days = 1;
        else if (range === "week") days = 7;
        else if (range === "month") days = 30;
        else if (range === "all") days = 90;

        const startDate = new Date(today);
        startDate.setDate(today.getDate() - days + 1);
        const startIso = startDate.toISOString().split("T")[0];

        const rangeFilter = (query) => query.gte("date", startIso);

        const res = await fetchFinalResult("day", rangeFilter);

        if (res) {
          const breakdown = [
            "Body",
            "Glaze",
            "Packing",
            "Fuel",
            "Gas",
            "Electricity",
            "Ink",
            "Fixed",
          ].map((key) => ({
            name: key,
            value: parseFloat(res[key]?.Total || 0),
          }));

          setData(breakdown);
          localStorage.setItem(cacheKey, JSON.stringify({ data: breakdown }));
        }
      } catch (err) {
        console.error("Error fetching final result:", err);
      }
    };

    loadData();

    // Listen for storage event to refresh chart if new data is added from another tab/page
    function handleStorage(e) {
      if (e.key === "refreshData" && e.newValue === "true") {
        localStorage.removeItem(cacheKey);
        loadData();
        localStorage.setItem("refreshData", "false");
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [range]);
  // compute total for percent calculations in legend/labels
  const total = useMemo(
    () => data.reduce((s, d) => s + (Number(d.value) || 0), 0),
    [data]
  );

  // Custom label to draw labels outside the pie to avoid overlap
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    index,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 16; // push label outside
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const entry = data[index] || {};
    const value = Number(entry.value) || 0;
    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";

    return (
      <text
        x={x}
        y={y}
        fill="#374151"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        style={{ fontSize: 12 }}
      >
        {`${entry.name} (${pct}%)`}
      </text>
    );
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-2xl w-full">
      <h2 className="text-xl font-bold text-gray-700 mb-4 text-center">
        Cost Breakdown
      </h2>

      {/* Layout: chart left, legend right on md+ screens; stacked on small screens */}
      <div className="w-full flex flex-col md:flex-row items-start gap-4">
        <div className="flex-1 h-80 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="40%" // donut
                outerRadius="65%"
                paddingAngle={4} // separation between slices
                minAngle={3} // ensure tiny slices are visible
                dataKey="value"
                nameKey="name"
                labelLine={true}
                label={renderCustomizedLabel}
                onClick={(d, idx) => {
                  if (data[idx]) handleSliceClick(data[idx].name);
                }}
                cursor="pointer"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip formatter={(value) => Number(value).toFixed(2)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom legend to the right to avoid in-chart label collisions */}
        <div className="w-full md:w-56 flex-shrink-0">
          <div className="flex flex-col gap-3">
            {data.map((entry, idx) => {
              const value = Number(entry.value) || 0;
              const pct =
                total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
              return (
                <button
                  key={`legend-${idx}`}
                  onClick={() => handleSliceClick(entry.name)}
                  className="flex items-center justify-between w-full text-left p-2 rounded hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-4 h-4 rounded"
                      style={{ background: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {entry.name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {value.toFixed(2)} ({pct}%)
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
