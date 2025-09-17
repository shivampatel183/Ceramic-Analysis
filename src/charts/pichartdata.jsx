import React, { useEffect, useState } from "react";
import CostTrendModal from "./CostTrendModal";
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
      const rangeFilter = (query) => query.gte("date", dateStr).lte("date", dateStr);
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

  return (
    <div className="p-6 bg-white shadow-lg rounded-2xl w-full">
      <h2 className="text-xl font-bold text-gray-700 mb-4 text-center">
        Cost Breakdown
      </h2>
      <div className="h-96 w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius="70%"
              dataKey="value"
              nameKey="name"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              onClick={(_, idx) => {
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
      <CostTrendModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        data={trendData}
        costName={selectedCost}
      />
            <Tooltip formatter={(value) => value.toFixed(2)} />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ marginTop: 10 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
