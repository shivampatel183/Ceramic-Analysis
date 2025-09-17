import React, { useEffect, useState } from "react";
import { fetchFinalResultHistory } from "../calculations/sizewisechartdata";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#4F46E5",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#3B82F6",
  "#8B5CF6",
];

export default function FinalResultHistoryCard({ range }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function load() {
      const history = await fetchFinalResultHistory(range);
      setData(history);
    }
    load();
  }, [range]);

  const allSizes = Array.from(
    new Set(
      data.flatMap((entry) =>
        Object.keys(entry.total || {}).filter((k) => k !== "Total")
      )
    )
  );

  const chartData = data.map((entry) => {
    const row = { date: entry.date };
    allSizes.forEach((size) => {
      row[size] = parseFloat(entry.total[size] || "0");
    });
    return row;
  });

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
      <h3 className="text-lg font-bold mb-4">Size-wise Final Result History</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {allSizes.map((size, idx) => (
              <Line
                key={size}
                type="monotone"
                dataKey={size}
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
