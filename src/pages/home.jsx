import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import SizeCostChart from "../components/SizeCostChart";
import CostDistributionPieChart from "../components/CostDistributionPieChart";
import { fetchFinalResultHistory } from "../calculations/finalresultHistory";

export default function HomeScreen() {
  const [ceramicName, setCeramicName] = useState("");
  const [timeFilter, setTimeFilter] = useState(
    () => localStorage.getItem("timeFilter") || "day"
  );
  const [costData, setCostData] = useState([]);

  useEffect(() => {
    fetchCeramicName();
  }, []);

  async function fetchCeramicName() {
    const { data } = await supabase
      .from("profiles")
      .select("ceramic_name")
      .single();
    if (data) setCeramicName(data.ceramic_name);
  }

  useEffect(() => {
    localStorage.setItem("timeFilter", timeFilter);
    fetchCostData();
  }, [timeFilter]);

  async function fetchCostData() {
    try {
      const data = await fetchFinalResultHistory(timeFilter);
      setCostData(data);
    } catch (error) {
      console.error("Error fetching cost data:", error);
    }
  }

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-700">
          👋 Welcome, <span className="text-indigo-600">{ceramicName}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <SizeCostChart
          fetchHistory={(range) => fetchFinalResultHistory(range)}
          initialRange={timeFilter}
        />
        <CostDistributionPieChart data={costData} />
      </div>
    </div>
  );
}
