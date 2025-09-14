import React, { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const CostDistributionPieChart = ({ data }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(153, 102, 255, 0.8)",
          "rgba(255, 159, 64, 0.8)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  });

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Calculate total cost for each size
    const sizeTotals = data.reduce((acc, entry) => {
      if (!acc[entry.size]) {
        acc[entry.size] = 0;
      }
      acc[entry.size] += parseFloat(entry.totalcost) || 0;
      return acc;
    }, {});

    // Calculate grand total
    const grandTotal = Object.values(sizeTotals).reduce((a, b) => a + b, 0);

    // Calculate percentages and prepare chart data
    const labels = [];
    const values = [];

    Object.entries(sizeTotals).forEach(([size, total]) => {
      const percentage = ((total / grandTotal) * 100).toFixed(1);
      labels.push(`${size} (${percentage}%)`);
      values.push(total);
    });

    setChartData({
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "rgba(255, 99, 132, 0.8)",
            "rgba(54, 162, 235, 0.8)",
            "rgba(255, 206, 86, 0.8)",
            "rgba(75, 192, 192, 0.8)",
            "rgba(153, 102, 255, 0.8)",
            "rgba(255, 159, 64, 0.8)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
          ],
          borderWidth: 1,
        },
      ],
    });
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          font: {
            size: 12,
          },
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.parsed || 0;
            return `${label}: ₹${value.toLocaleString()}`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Cost Distribution by Size
      </h3>
      <div className="h-[400px]">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
};

export default CostDistributionPieChart;
