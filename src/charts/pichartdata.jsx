import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import ReactApexChart from "react-apexcharts";
import { Loader2 } from "lucide-react";
import { calculatePowderConsumption } from "../calculations/powder";
import { calculateGlazeConsumption } from "../calculations/glaze";
import { calculateFuelConsumption } from "../calculations/fuel";
import { calculateGasConsumption } from "../calculations/gas";
import { calculateElectricityCost } from "../calculations/electricity";
import { calculatePackingCost } from "../calculations/packing";
import { calculateFixedCost } from "../calculations/fixedcost";
import { calculateInkCost } from "../calculations/inkcost";

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

export default function TotalBreakdownPie({ range }) {
  const [chartData, setChartData] = useState({ series: [], labels: [] });
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
          setChartData({ series: [], labels: [] });
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

        const series = [
          Number(powder.total.toFixed(0)),
          Number(glaze.totalConsumption.toFixed(0)),
          Number(fuel.totalFuel.toFixed(0)),
          Number(gas.totalGas.toFixed(0)),
          Number(electricity.total.toFixed(0)),
          Number(packing.total.toFixed(0)),
          Number(fixed.total.toFixed(0)),
          Number(ink.total.toFixed(0)),
        ];

        const labels = [
          "Powder",
          "Glaze",
          "Fuel",
          "Gas",
          "Electricity",
          "Packing",
          "Fixed Cost",
          "Ink",
        ];

        // Filter out zero-value categories
        const filteredSeries = [];
        const filteredLabels = [];
        series.forEach((val, index) => {
          if (val > 0) {
            filteredSeries.push(val);
            filteredLabels.push(labels[index]);
          }
        });

        setChartData({ series: filteredSeries, labels: filteredLabels });
      } catch (error) {
        console.error("Error fetching pie chart data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [range]);

  const chartOptions = {
    chart: { type: "donut", fontFamily: "inherit" },
    labels: chartData.labels,
    legend: { position: "bottom", fontFamily: "inherit" },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { width: "100%" },
          legend: { position: "bottom" },
        },
      },
    ],
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Cost",
              formatter: (w) => {
                const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                return "₹ " + total.toLocaleString("en-IN");
              },
            },
          },
        },
      },
    },
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Total Cost Breakdown
      </h2>
      {loading ? (
        <div className="flex justify-center items-center h-80">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
        </div>
      ) : chartData.series.length > 0 ? (
        <ReactApexChart
          options={chartOptions}
          series={chartData.series}
          type="donut"
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
