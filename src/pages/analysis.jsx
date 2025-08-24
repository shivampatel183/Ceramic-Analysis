import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";

export default function Analysis() {
  const [timeFilter, setTimeFilter] = useState("day");
  const [totalPowder, setTotalPowder] = useState(0);
  const [powderBySize, setPowderBySize] = useState({});
  const [netProduction, setNetProduction] = useState(0);
  const [sizeData, setSizeData] = useState([]);
  const [totalGlazeLoss, setTotalGlazeLoss] = useState(0);
  const [totalGlazeConsumption, setTotalGlazeConsumption] = useState(0);
  const [glazeBySize, setGlazeBySize] = useState({});

  // 🔹 Body cost map for Powder Consumption
  const bodyCostMap = {
    "600x600": 1.395,
    "200x1000": 1.395,
    "150x900": 1.395,
    "200x1200": 1.29,
    "400x400": 1.218,
  };

  // 🔹 Glaze factors (Loss & Consumption multipliers)
  const glazeFactors = {
    "600x600": { loss: 14.8991, cons: 15.19427 },
    "200x1000": { loss: 16.19602, cons: 16.51994 },
    "150x900": { loss: 24.5, cons: 24.99 },
    "200x1200": { loss: 31.7746, cons: 32.4079 },
    "400x400": { loss: 6.75127, cons: 6.8862954 },
  };

  useEffect(() => {
    fetchNetProduction(timeFilter);
    fetchProductionBySize(timeFilter);
    fetchPowderConsumption(timeFilter);
    fetchGlazeConsumption(timeFilter);
  }, [timeFilter]);

  // 🔹 Helper: Apply date filter
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
    return query; // all time
  }

  // 🔹 Fetch Powder Consumption
  async function fetchPowderConsumption(filter) {
    let query = supabase
      .from("production_data")
      .select("size, press_box, green_box_weight, date");

    query = applyDateFilter(query, filter);

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching powder data:", error);
      return;
    }

    let total = 0;
    let sizeWise = {};

    data.forEach((row) => {
      const size = row.size;
      const press = Number(row.press_box) || 0;
      const green = Number(row.green_box_weight) || 0;
      const bodyCost = bodyCostMap[size] || 0;

      const consumption = press * green * 1.05 * bodyCost;

      total += consumption;
      sizeWise[size] = (sizeWise[size] || 0) + consumption;
    });

    setTotalPowder(total);
    setPowderBySize(sizeWise);
  }

  // 🔹 Fetch Glaze Consumption
  async function fetchGlazeConsumption(filter) {
    let query = supabase
      .from("production_data")
      .select("size, kiln_entry_box, before_flow, date");

    query = applyDateFilter(query, filter);

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching glaze data:", error);
      return;
    }

    let totalLoss = 0;
    let totalConsumption = 0;
    let sizeWise = {};

    data.forEach((row) => {
      const size = row.size;
      const kilnEntry = Number(row.kiln_entry_box) || 0;
      const beforeFlow = (Number(row.before_flow) || 0) * 0.995;

      if (!glazeFactors[size]) return;

      const { loss, cons } = glazeFactors[size];

      const glazeLoss = (beforeFlow - kilnEntry) * loss;
      const glazeConsumption = beforeFlow * cons;

      totalLoss += glazeLoss;
      totalConsumption += glazeConsumption;

      sizeWise[size] = {
        loss: (sizeWise[size]?.loss || 0) + glazeLoss,
        consumption: (sizeWise[size]?.consumption || 0) + glazeConsumption,
      };
    });

    setTotalGlazeLoss(totalLoss);
    setTotalGlazeConsumption(totalConsumption);
    setGlazeBySize(sizeWise);
  }

  // 🔹 Fetch Net Production
  async function fetchNetProduction(filter) {
    let query = supabase
      .from("production_data")
      .select("kiln_entry_box, packing_box, fired_loss_box, before_flow, date");

    query = applyDateFilter(query, filter);

    const { data } = await query;
    calculateNetProduction(data);
  }

  function calculateNetProduction(data) {
    if (!data || data.length === 0) {
      setNetProduction(0);
      return;
    }

    let total = 0;
    data.forEach((row) => {
      const kilnEntry = Number(row.kiln_entry_box) || 0;
      const packingBox = Number(row.packing_box) || 0;
      const kilnFiredLoss = Number(row.fired_loss_box) || 0;
      const sizingFiredLoss = Number(row.before_flow) || 0;

      const calc =
        kilnEntry -
        packingBox -
        (kilnEntry - packingBox - kilnFiredLoss - sizingFiredLoss) * 0.015;

      total += calc;
    });
    setNetProduction(total);
  }

  // 🔹 Fetch Production by Size
  async function fetchProductionBySize(filter) {
    let query = supabase
      .from("production_data")
      .select("size, kiln_entry_box, date");

    query = applyDateFilter(query, filter);

    const { data } = await query;
    groupBySize(data);
  }

  function groupBySize(data) {
    if (!data || data.length === 0) {
      setSizeData([]);
      return;
    }

    const grouped = {};
    data.forEach((row) => {
      const size = row.size;
      const production = Number(row.kiln_entry_box) || 0;
      grouped[size] = (grouped[size] || 0) + production;
    });

    setSizeData(
      Object.entries(grouped).map(([size, total]) => ({ size, total }))
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-700">
          📊 Production Analysis
        </h2>

        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="text-sm font-medium border border-indigo-200 rounded px-4 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        >
          <option value="day">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Net Production + Production by Size */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Net Production */}
        <Card className="shadow-md rounded-xl border-0 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Net Production
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-indigo-600">
              {netProduction.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Units</p>
          </CardContent>
        </Card>

        {/* Production by Size */}
        <Card className="shadow-md rounded-xl border-0 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Production by Size
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

      {/* Powder Consumption + Powder by Size */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-5">
        {/* Total Powder */}
        <Card className="shadow-md rounded-xl border-0 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Powder Consumption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-indigo-600">
              {totalPowder.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Kg (approx.)</p>
          </CardContent>
        </Card>

        {/* Powder Consumption by Size */}
        <Card className="shadow-md rounded-xl border-0 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Powder Consumption by Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="p-2 text-left">Size</th>
                  <th className="p-2 text-right">Powder Consumption</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(powderBySize).length > 0 ? (
                  Object.entries(powderBySize).map(([size, value], idx) => (
                    <tr
                      key={idx}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="p-2">{size}</td>
                      <td className="p-2 text-right">{value.toFixed(2)}</td>
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

      {/* Glaze Consumption */}
      <div className="grid grid-cols-1 gap-8 mt-5">
        <Card className="shadow-md rounded-xl border-0 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Glaze Consumption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-4">
              <div>
                <p className="text-xs text-gray-500">Total Line Loss</p>
                <p className="text-lg font-bold text-indigo-600">
                  {totalGlazeLoss.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Consumption</p>
                <p className="text-lg font-bold text-indigo-600">
                  {totalGlazeConsumption.toFixed(2)}
                </p>
              </div>
            </div>

            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="p-2 text-left">Size</th>
                  <th className="p-2 text-right">Line Loss</th>
                  <th className="p-2 text-right">Consumption</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(glazeBySize).length > 0 ? (
                  Object.entries(glazeBySize).map(([size, values], idx) => (
                    <tr
                      key={idx}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="p-2">{size}</td>
                      <td className="p-2 text-right">
                        {values.loss.toFixed(2)}
                      </td>
                      <td className="p-2 text-right">
                        {values.consumption.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="p-2 text-center text-gray-500">
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
