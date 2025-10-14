import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import FinalResultHistoryCard from "../charts/sizewisechart";
import TotalBreakdownPie from "../charts/pichartdata";
import SizewiseStackedBarChart from "../charts/SizewiseStackedBarChart";

const GLOBAL_TIME_FILTER_KEY = "globalTimeFilter";

export default function HomeScreen() {
  const [ceramicName, setCeramicName] = useState("");
  const [timeFilter, setTimeFilter] = useState(
    () => localStorage.getItem(GLOBAL_TIME_FILTER_KEY) || "week"
  );

  useEffect(() => {
    localStorage.setItem(GLOBAL_TIME_FILTER_KEY, timeFilter);
  }, [timeFilter]);

  useEffect(() => {
    async function fetchCeramicName() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !user.id) return;
      const { data } = await supabase
        .from("profiles")
        .select("ceramic_name")
        .eq("id", user.id)
        .limit(1)
        .single();
      if (data) {
        setCeramicName(data.ceramic_name);
      }
    }
    fetchCeramicName();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            👋 Welcome,{" "}
            <span className="text-indigo-600">{ceramicName || "..."}</span>
          </h1>
          <p className="text-gray-500 mt-1">Here's your production summary.</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <label className="text-sm font-medium text-gray-700">
            Date Range:
          </label>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition text-sm p-1.5"
          >
            <option value="day">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        <FinalResultHistoryCard range={timeFilter} />
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          <div className="xl:col-span-3">
            <TotalBreakdownPie range={timeFilter} />
          </div>
          <div className="xl:col-span-2">
            <SizewiseStackedBarChart range={timeFilter} />
          </div>
        </div>
      </div>
    </div>
  );
}
