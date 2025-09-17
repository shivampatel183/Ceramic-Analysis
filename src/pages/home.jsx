import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import FinalResultHistoryCard from "../charts/sizewisechart";
import TotalBreakdownPie from "../charts/pichartdata";
export default function HomeScreen() {
  const [ceramicName, setCeramicName] = useState("");
  const [timeFilter, setTimeFilter] = useState(
    () => localStorage.getItem("timeFilter") || "week"
  );

  useEffect(() => {
    const cacheKey = "ceramic_name_cache";
    const cache = localStorage.getItem(cacheKey);
    if (cache) {
      try {
        const parsed = JSON.parse(cache);
        setCeramicName(parsed.ceramicName || "");
        return;
      } catch (e) {}
    }
    fetchCeramicName();
  }, []);

  async function fetchCeramicName() {
    const { data } = await supabase
      .from("profiles")
      .select("ceramic_name")
      .single();
    if (data) {
      setCeramicName(data.ceramic_name);
      localStorage.setItem("ceramic_name_cache", JSON.stringify({ ceramicName: data.ceramic_name }));
    }
  }

  useEffect(() => {
    localStorage.setItem("timeFilter", timeFilter);
  }, [timeFilter]);

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-700">
          👋 Welcome, <span className="text-indigo-600">{ceramicName}</span>
        </h2>
        <div className="flex w-full md:w-auto items-center gap-3 md:gap-4">
          <label className="text-sm md:text-base text-indigo-700 font-semibold">
            Range
          </label>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="flex-1 md:flex-none text-sm md:text-base border border-indigo-300 rounded-lg px-3 md:px-4 py-2 bg-white shadow focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="day">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Chart Card Section */}
      <FinalResultHistoryCard range={timeFilter} />
      <div class="my-10 flex">
        <TotalBreakdownPie range={timeFilter} />
      </div>
    </div>
  );
}
