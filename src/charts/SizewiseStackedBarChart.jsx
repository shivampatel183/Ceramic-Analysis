import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import ReactApexChart from "react-apexcharts";
import { Loader2 } from "lucide-react";
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

// 1. Date filter helper
function applyDateFilter(query, filter) {
  const today = new Date();
  if (filter === "day") {
    return query.gte("date", today.toISOString().split("T")[0]);
  }
  if (filter === "week") {
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    return query.gte("date", weekAgo.toISOString().split("T")[0]);
  }
  if (filter === "month") {
    const monthAgo = new Date();
    monthAgo.setMonth(today.getMonth() - 1);
    return query.gte("date", monthAgo.toISOString().split("T")[0]);
  }
  return query;
}

export default function SizewiseStackedBarChart({ range }) {
  const [chartData, setChartData] = useState({ series: [], categories: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      try {
        // 2. Get user first
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not found");

        // 3. Fetch all required data in parallel
        let prodQuery = supabase
          .from("production_data")
          .select("*")
          .eq("user_id", user.id);
        prodQuery = applyDateFilter(prodQuery, range);

        const settingsQuery = supabase
          .from("cost_settings_history")
          .select("*")
          .eq("user_id", user.id);

        const [prodResult, settingsResult] = await Promise.all([
          prodQuery,
          settingsQuery,
        ]);

        if (prodResult.error) throw prodResult.error;
        if (settingsResult.error) throw settingsResult.error;

        const productionData = prodResult.data || [];
        const allCostHistory = settingsResult.data || [];

        if (productionData.length === 0) {
          setChartData({ series: [], categories: [] });
          setLoading(false);
          return;
        }

        // 4. Run calculations WITH cost history
        const powder = calculatePowderConsumption(
          productionData,
          allCostHistory
        );
        const glaze = calculateGlazeConsumption(productionData, allCostHistory);
        const fuel = calculateFuelConsumption(productionData, allCostHistory);
        const gas = calculateGasConsumption(productionData, allCostHistory);
        const electricity = calculateElectricityCost(
          productionData,
          allCostHistory
        );
        const packing = calculatePackingCost(productionData, allCostHistory);
        const fixed = calculateFixedCost(productionData, allCostHistory);
        const ink = calculateInkCost(productionData, allCostHistory);
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

        // Backwards-compat: older/newer calculateFinalResult implementations may
        // return either an array (per-size items) OR an object with breakdown
        // maps (Body, Glaze, Total, etc.). Normalize both into an array shape
        // the chart expects: [{ size, powder, glaze, fuel, gas, electricity, packing, fixed, ink }, ...]
        let normalized = null;

        if (Array.isArray(finalResult)) {
          normalized = finalResult;
        } else if (finalResult && typeof finalResult === "object") {
          // prefer finalResult.Total keys if present
          const totalObj = finalResult.Total || {};
          const sizes = Object.keys(totalObj).filter((s) => s !== "Total");
          if (sizes.length > 0) {
            normalized = sizes.map((size) => ({
              size,
              powder: Number(finalResult.Body?.[size] || 0),
              glaze: Number(finalResult.Glaze?.[size] || 0),
              fuel: Number(finalResult.Fuel?.[size] || 0),
              gas: Number(finalResult.Gas?.[size] || 0),
              electricity: Number(finalResult.Electricity?.[size] || 0),
              packing: Number(finalResult.Packing?.[size] || 0),
              fixed: Number(finalResult.Fixed?.[size] || 0),
              ink: Number(finalResult.Ink?.[size] || 0),
            }));
          }
        }

        if (!normalized || normalized.length === 0) {
          setChartData({ series: [], categories: [] });
          setLoading(false);
          return;
        }

        // 5. Format data for the stacked bar chart
        const categories = normalized.map((item) => item.size);
        // helper to compute cost per unit for each size (supports array or object shapes)
        const getCostPerUnit = (item) => {
          // If the normalized item already has a costPerUnit field, use it
          if (item.costPerUnit != null) return Number(item.costPerUnit) || 0;
          // If item has totalCost and we have production counts, derive cost per unit
          if (item.totalCost != null) {
            const prodEntry = productionBySize.find(
              (p) => p.size === item.size
            );
            const prod = prodEntry ? Number(prodEntry.total) || 1 : 1;
            return prod === 0 ? 0 : Number(item.totalCost) / prod;
          }
          // Fallback: try to use Total map from finalResult if available
          if (
            finalResult &&
            finalResult.Total &&
            finalResult.Total[item.size] != null
          ) {
            return Number(finalResult.Total[item.size]) || 0;
          }
          return 0;
        };

        const series = [
          {
            name: "Powder",
            data: normalized.map((item) => Number(item.powder || 0).toFixed(0)),
          },
          {
            name: "Glaze",
            data: normalized.map((item) => Number(item.glaze || 0).toFixed(0)),
          },
          {
            name: "Fuel",
            data: normalized.map((item) => Number(item.fuel || 0).toFixed(0)),
          },
          {
            name: "Gas",
            data: normalized.map((item) => Number(item.gas || 0).toFixed(0)),
          },
          {
            name: "Electricity",
            data: normalized.map((item) =>
              Number(item.electricity || 0).toFixed(0)
            ),
          },
          {
            name: "Packing",
            data: normalized.map((item) =>
              Number(item.packing || 0).toFixed(0)
            ),
          },
          {
            name: "Fixed",
            data: normalized.map((item) => Number(item.fixed || 0).toFixed(0)),
          },
          {
            name: "Ink",
            data: normalized.map((item) => Number(item.ink || 0).toFixed(0)),
          },
        ];

        setChartData({ series, categories });
      } catch (error) {
        console.error("Error fetching stacked bar data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [range]);

  const chartOptions = {
    chart: { type: "bar", height: 350, stacked: true, fontFamily: "inherit" },
    plotOptions: {
      bar: {
        horizontal: true,
        dataLabels: { total: { enabled: true, offsetX: 0 } },
      },
    },
    stroke: { width: 1, colors: ["#fff"] },
    xaxis: {
      categories: chartData.categories,
      labels: { formatter: (val) => "₹ " + val.toLocaleString("en-IN") },
    },
    yaxis: { title: { text: undefined } },
    tooltip: {
      y: {
        formatter: (val) => "₹ " + val.toLocaleString("en-IN"),
      },
    },
    fill: { opacity: 1 },
    legend: { position: "top", horizontalAlign: "left", offsetX: 40 },
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Total Cost by Size
      </h2>
      {loading ? (
        <div className="flex justify-center items-center h-80">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
        </div>
      ) : chartData.series.length > 0 ? (
        <ReactApexChart
          options={chartOptions}
          series={chartData.series}
          type="bar"
          height={350}
        />
      ) : (
        <div className="flex justify-center items-center h-80">
          <p className="text-gray-500">No data available for this period.</p>
        </div>
      )}
    </div>
  );
}
