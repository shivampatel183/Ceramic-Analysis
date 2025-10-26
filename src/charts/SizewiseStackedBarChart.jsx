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

        if (!finalResult || finalResult.length === 0) {
          setChartData({ series: [], categories: [] });
          setLoading(false);
          return;
        }

        // 5. Format data for the stacked bar chart
        const categories = finalResult.map((item) => item.size);
        const series = [
          {
            name: "Powder",
            data: finalResult.map((item) => item.powder.toFixed(0)),
          },
          {
            name: "Glaze",
            data: finalResult.map((item) => item.glaze.toFixed(0)),
          },
          {
            name: "Fuel",
            data: finalResult.map((item) => item.fuel.toFixed(0)),
          },
          { name: "Gas", data: finalResult.map((item) => item.gas.toFixed(0)) },
          {
            name: "Electricity",
            data: finalResult.map((item) => item.electricity.toFixed(0)),
          },
          {
            name: "Packing",
            data: finalResult.map((item) => item.packing.toFixed(0)),
          },
          {
            name: "Fixed",
            data: finalResult.map((item) => item.fixed.toFixed(0)),
          },
          { name: "Ink", data: finalResult.map((item) => item.ink.toFixed(0)) },
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
