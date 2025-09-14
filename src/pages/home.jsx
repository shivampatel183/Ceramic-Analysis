import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import SizeCostChart from "../components/SizeCostChart";
import { fetchFinalResultHistory } from "../calculations/finalresultHistory";

export default function HomeScreen() {
  const [ceramicName, setCeramicName] = useState("");
  const [timeFilter, setTimeFilter] = useState(
    () => localStorage.getItem("timeFilter") || "week"
  );

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
  }, [timeFilter]);

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-700">
          👋 Welcome, <span className="text-indigo-600">{ceramicName}</span>
        </h2>
      </div>
      <SizeCostChart
        fetchHistory={(range) => fetchFinalResultHistory(range)}
        initialRange={timeFilter}
      />
    </div>
  );
}
