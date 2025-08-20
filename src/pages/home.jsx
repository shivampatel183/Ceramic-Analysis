import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";

export default function HomeScreen() {
  const [ceramicName, setCeramicName] = useState("");
  const [timeFilter, setTimeFilter] = useState("day");
  const [netProduction, setNetProduction] = useState(0);
  const [sizeData, setSizeData] = useState([]); // production by size

  useEffect(() => {
    fetchCeramicName();
  }, []);

  // run fetch whenever filter changes
  useEffect(() => {
    fetchNetProduction(timeFilter);
    fetchProductionBySize(timeFilter);
  }, [timeFilter]);

  async function fetchCeramicName() {
    const { data } = await supabase
      .from("profiles")
      .select("ceramic_name")
      .single();
    if (data) setCeramicName(data.ceramic_name);
  }

  async function fetchNetProduction(filter) {
    let fromDate = new Date();
    const today = new Date().toISOString().split("T")[0];

    if (filter === "day") {
      const { data } = await supabase
        .from("production_data")
        .select("kiln_entry_box, packing_box, fired_loss_box, before_flow")
        .eq("date", today);

      calculateNetProduction(data);
      return;
    }

    if (filter === "week") fromDate.setDate(fromDate.getDate() - 7);
    if (filter === "month") fromDate.setMonth(fromDate.getMonth() - 1);

    const { data } = await supabase
      .from("production_data")
      .select("kiln_entry_box, packing_box, fired_loss_box, before_flow")
      .gte("date", fromDate.toISOString().split("T")[0]);

    calculateNetProduction(data);
  }

  async function fetchProductionBySize(filter) {
    let fromDate = new Date();
    const today = new Date().toISOString().split("T")[0];

    if (filter === "day") {
      const { data } = await supabase
        .from("production_data")
        .select("size, packing_box")
        .eq("date", today);
      groupBySize(data);
      return;
    }

    if (filter === "week") fromDate.setDate(fromDate.getDate() - 7);
    if (filter === "month") fromDate.setMonth(fromDate.getMonth() - 1);

    const { data } = await supabase
      .from("production_data")
      .select("size, packing_box")
      .gte("date", fromDate.toISOString().split("T")[0]);

    groupBySize(data);
  }

  function calculateNetProduction(data) {
    if (data && data.length > 0) {
      let total = 0;
      data.forEach((row) => {
        const kilnEntry = row.kiln_entry_box || 0;
        const packingBox = row.packing_box || 0;
        const kilnFiredLoss = row.fired_loss_box || 0;
        const sizingFiredLoss = row.before_flow || 0;

        const calc =
          kilnEntry -
          packingBox -
          (kilnEntry - packingBox - kilnFiredLoss - sizingFiredLoss) * 0.015;

        total += calc;
      });
      setNetProduction(total);
    } else {
      setNetProduction(0);
    }
  }

  function groupBySize(data) {
    if (!data) return;
    const grouped = {};
    data.forEach((row) => {
      const size = row.size || "Unknown";
      const boxes = row.packing_box || 0;
      grouped[size] = (grouped[size] || 0) + boxes;
    });
    const result = Object.keys(grouped).map((size) => ({
      size,
      total: grouped[size],
    }));
    setSizeData(result);
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      {/* Header */}
      <h1 className="text-xl font-bold mb-6 text-gray-800">
        👋 Welcome, <span className="text-indigo-600">{ceramicName}</span>
      </h1>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {/* Net Production Card */}
        <Card className="shadow-md hover:shadow-xl transition rounded-xl border-0 bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between w-full">
              <span>Net Production</span>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="ml-2 text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-2xl font-bold text-indigo-600">
              {netProduction.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Units</p>
          </CardContent>
        </Card>

        {/* Production by Size Table */}

        <Card className="shadow-md rounded-xl border-0 bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between w-full">
              <span>Production by Size</span>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="ml-2 text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="p-2 text-left">Size</th>
                  <th className="p-2 text-right">Total Production</th>
                </tr>
              </thead>
              <tbody>
                {sizeData.length > 0 ? (
                  sizeData.map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="p-2">{row.size}</td>
                      <td className="p-2 text-right">{row.total}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="p-2 text-center text-gray-500">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
