import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
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
        const result = await fetchFinalResult(range, (q) => q);
        console.log("Fetched Final Result:", result);
        if (result) {
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
            value: parseFloat(result[key]?.Total) || 0,
          }));

          setData(breakdown);
          console.log(breakdown);
        }
      } catch (err) {
        console.error("Error fetching final result:", err);
      }
    };
    loadData();
  }, [range]);

  return (
    <div className="p-4 flex flex-col items-center">
      <h2 className="text-lg font-semibold mb-4">Cost Breakdown</h2>
      <PieChart width={400} height={400}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={150}
          dataKey="value"
          nameKey="name"
          label={(entry) => `${entry.name}: ${entry.value}`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
}
