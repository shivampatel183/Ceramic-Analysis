import React, { useEffect, useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "../supabaseClient";

// Import all calculation functions
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
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

        const { data: productionData, error } = await supabase
          .from("production_data")
          .select("*")
          .gte("date", startIso);

        if (error) throw error;

        if (productionData && productionData.length > 0) {
          const powder = calculatePowderConsumption(productionData);
          const glaze = calculateGlazeConsumption(productionData);
          const fuel = calculateFuelConsumption(productionData);
          const gas = calculateGasConsumption(productionData);
          const electricity = calculateElectricityCost(productionData);
          const packing = calculatePackingCost(productionData);
          const fixed = calculateFixedCost(productionData);
          const ink = calculateInkCost(productionData);
          const netProductionResult = calculateNetProduction(productionData);
          const productionBySize = calculateProductionBySize(productionData);

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
            value: parseFloat(finalResult[key]?.Total || 0),
          }));
          setData(breakdown);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error("Error fetching pie chart data:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [range]);

  const total = useMemo(
    () => data.reduce((s, d) => s + (Number(d.value) || 0), 0),
    [data]
  );

  const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 16;
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

  if (loading) {
    return (
      <div className="p-6 bg-white shadow-lg rounded-2xl w-full flex justify-center items-center h-96">
        <p>Loading Chart...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white shadow-lg rounded-2xl w-full">
      <h2 className="text-xl font-bold text-gray-700 mb-4 text-center">
        Cost Breakdown
      </h2>
      <div className="w-full flex flex-col md:flex-row items-start gap-4">
        <div className="flex-1 h-80 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="65%"
                paddingAngle={4}
                minAngle={3}
                dataKey="value"
                nameKey="name"
                labelLine={true}
                label={renderCustomizedLabel}
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
        <div className="w-full md:w-56 flex-shrink-0">
          <div className="flex flex-col gap-3">
            {data.map((entry, idx) => {
              const value = Number(entry.value) || 0;
              const pct =
                total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
              return (
                <div
                  key={`legend-${idx}`}
                  className="flex items-center justify-between w-full text-left p-2 rounded"
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
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
