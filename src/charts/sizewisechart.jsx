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

        const dateMap = new Map();
        for (let i = 0; i < days; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const iso = d.toISOString().split("T")[0];
          dateMap.set(iso, []);
        }
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - days + 1);
        const startIso = startDate.toISOString().split("T")[0];

        const { data: productionData, error } = await supabase
          .from("production_data")
          .select("*")
          .gte("date", startIso);

        if (error) throw error;

        // Group fetched data by date
        productionData.forEach((row) => {
          if (dateMap.has(row.date)) {
            dateMap.get(row.date).push(row);
          }
        });

        const history = [];
        for (const [date, dailyData] of dateMap.entries()) {
          if (dailyData.length === 0) {
            history.push({ date: date, total: {} });
            continue;
          }

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

          history.push({ date, total: finalResult?.Total ?? {} });
        }

        history.sort((a, b) => new Date(a.date) - new Date(b.date));
        setData(history);
      } catch (error) {
        console.error("Error fetching final result history:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [range]);

  const allSizes = useMemo(
    () =>
      Array.from(
        new Set(
          data.flatMap((entry) =>
            Object.keys(entry.total || {}).filter((k) => k !== "Total")
          )
        )
      ).sort(),
    [data]
  );

  const sizeColorMap = useMemo(() => {
    const map = {};
    allSizes.forEach((size, idx) => {
      map[size] = COLORS[idx % COLORS.length];
    });
    return map;
  }, [allSizes]);

  const chartData = useMemo(
    () =>
      data.map((entry) => {
        const row = { date: entry.date };
        allSizes.forEach((size) => {
          row[size] = parseFloat(entry.total[size] || "0");
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
            {allSizes.map((size) => (
              <Line
                key={size}
                type="monotone"
                dataKey={size}
                stroke={sizeColorMap[size]}
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
