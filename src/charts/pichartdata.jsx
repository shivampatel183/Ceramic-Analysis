import React, { useEffect, useState } from "react";
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

  useEffect(() => {
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
        }
      } catch (err) {
        console.error("Error fetching final result:", err);
      }
    };

    loadData();
  }, [range]);

  return (
    <div className="p-6 bg-white shadow-lg rounded-2xl w-full max-w-xl">
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
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
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
