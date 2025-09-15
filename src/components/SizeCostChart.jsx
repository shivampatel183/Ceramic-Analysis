import React, { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// sizes order
const SIZES = ["600x600", "200x1000", "150x900", "200x1200", "400x400"];

// transform finalResult history into datasets for chart
// expects dailyResults: array of { date: 'YYYY-MM-DD', result: finalResult }
// Uses only the Total row for each size
function transformData(dailyResults, days) {
  // For 14/30 days, show only every 5th date label, but keep all points
  let labels = dailyResults.map((r) => r.date);
  if (days > 7) {
    labels = labels.map((label, idx) => (idx % 3 === 0 ? label : ""));
  }
  const datasets = SIZES.map((size, idx) => {
    return {
      label: size,
      data: dailyResults.map((r) => Number(r.result?.Total?.[size] || 0)),
      borderColor: [
        "#2563eb", // blue
        "#dc2626", // red
        "#f59e42", // orange
        "#059669", // green
        "#a21caf", // purple
      ][idx % 5],
      backgroundColor: "rgba(0,0,0,0)",
      borderWidth: 3,
      pointRadius: 4,
      pointBackgroundColor: "#fff",
      pointBorderColor: ["#2563eb", "#dc2626", "#f59e42", "#059669", "#a21caf"][
        idx % 5
      ],
      tension: 0.35,
    };
  });
  return { labels, datasets };
}

export default function SizeCostChart({ fetchHistory, initialRange = "week" }) {
  const [history, setHistory] = useState([]);

  const VALID_RANGES = ["day", "week", "month", "all"];
  const normalizedInitial =
    typeof initialRange === "string" ? initialRange.toLowerCase() : "week";
  const [range, setRange] = useState(
    VALID_RANGES.includes(normalizedInitial) ? normalizedInitial : "week"
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!fetchHistory) return;
      const data = await fetchHistory(range);
      if (!cancelled) setHistory(data || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchHistory, range]);

  // For chartData, use range to determine days
  const rangeToDays = { day: 1, week: 7, month: 30, all: 90 };
  const chartData = useMemo(
    () => transformData(history, rangeToDays[range]),
    [history, range]
  );

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: { size: 16, family: "Inter, sans-serif", weight: "bold" },
          color: "#374151",
        },
      },
      title: {
        display: true,
        text: "Size-wise Final Cost Trend",
        font: { size: 22, family: "Inter, sans-serif", weight: "bold" },
        color: "#1e293b",
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "#fff",
        titleColor: "#1e293b",
        bodyColor: "#374151",
        borderColor: "#6366f1",
        borderWidth: 2,
        titleFont: { size: 16, weight: "bold" },
        bodyFont: { size: 15 },
        padding: 12,
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ₹${context.parsed.y}`;
          },
        },
      },
    },
    interaction: { mode: "nearest", intersect: false },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Date",
          font: { size: 16, weight: "bold" },
          color: "#334155",
        },
        grid: { color: "#e0e7ef" },
        ticks: {
          color: "#334155",
          font: { size: 14 },
          autoSkip: false,
          callback: function (value, index, ticks) {
            // Only show non-empty labels
            return chartData.labels[index] !== ""
              ? chartData.labels[index]
              : "";
          },
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "Final Cost (₹)",
          font: { size: 16, weight: "bold" },
          color: "#334155",
        },
        grid: { color: "#e0e7ef" },
        ticks: { color: "#334155", font: { size: 14 } },
      },
    },
  };

  return (
    <div className="mt-8 p-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-2xl max-w-full border border-indigo-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-indigo-800 tracking-tight">
          Size-wise Final Cost Trend
        </h3>
        <div className="flex items-center gap-4">
          <label className="text-base text-indigo-700 font-semibold">
            Range
          </label>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="text-base border border-indigo-300 rounded-lg px-4 py-2 bg-white shadow focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="day">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            {/* <option value="all">All Time</option> */}
          </select>
        </div>
      </div>

      <div
        style={{ height: 480 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <Line options={options} data={chartData} />
      </div>
      <div className="flex justify-end mt-2">
        <span className="text-xs text-gray-500">
          Source: Final Cost Table (Total row for each size)
        </span>
      </div>
    </div>
  );
}
