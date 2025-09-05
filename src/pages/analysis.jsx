import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";

// 🔹 Import calculation helpers
import { fetchPowderConsumption } from "../calculations/powder";
import { fetchGlazeConsumption } from "../calculations/glaze";
import {
  fetchNetProduction,
  fetchProductionBySize,
} from "../calculations/netProduction";
import { fetchFuelConsumption } from "../calculations/fuel";
import { fetchGasConsumption } from "../calculations/gas";

export default function Analysis() {
  const [timeFilter, setTimeFilter] = useState("day");

  // powder states
  const [totalPowder, setTotalPowder] = useState(0);
  const [powderBySize, setPowderBySize] = useState({});

  // glaze states
  const [totalGlazeLoss, setTotalGlazeLoss] = useState(0);
  const [totalGlazeConsumption, setTotalGlazeConsumption] = useState(0);
  const [glazeBySize, setGlazeBySize] = useState({});

  // net production states
  const [netProduction, setNetProduction] = useState(0);
  const [sizeData, setSizeData] = useState([]);

  // fuel states
  const [totalFuel, setTotalFuel] = useState(0);
  const [fuelBySize, setFuelBySize] = useState({});
  const [coalConsumptionKgPerTon, setCoalConsumptionKgPerTon] = useState(0);

  // gas states
  const [totalGas, setTotalGas] = useState(0);
  const [gasBySize, setGasBySize] = useState({});
  const [kclPerKg, setKclPerKg] = useState(0);

  // 🔹 Apply date filter
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

  useEffect(() => {
    (async () => {
      // Powder
      const powder = await fetchPowderConsumption(timeFilter, applyDateFilter);
      setTotalPowder(powder.total);
      setPowderBySize(powder.sizeWise);

      // Glaze
      const glaze = await fetchGlazeConsumption(timeFilter, applyDateFilter);
      setTotalGlazeLoss(glaze.totalLoss);
      setTotalGlazeConsumption(glaze.totalConsumption);
      setGlazeBySize(glaze.sizeWise);

      // Net Production
      const net = await fetchNetProduction(timeFilter, applyDateFilter);
      setNetProduction(net);

      const size = await fetchProductionBySize(timeFilter, applyDateFilter);
      setSizeData(size);

      // Fuel
      const fuel = await fetchFuelConsumption(timeFilter, applyDateFilter);
      setTotalFuel(fuel.totalFuel);
      setFuelBySize(fuel.fuelBySize);
      setCoalConsumptionKgPerTon(fuel.coalConsumptionKgPerTon);

      // Gas
      const gas = await fetchGasConsumption(timeFilter, applyDateFilter);
      setTotalGas(gas.totalGas);
      setGasBySize(gas.gasBySize);
      setKclPerKg(gas.kclPerKg);
    })();
  }, [timeFilter]);

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
            <p className="text-lg font-bold text-indigo-600">
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
            <p className="text-lg font-bold text-indigo-600">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-5">
        <Card className="shadow-md rounded-xl border-0 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Glaze Consumption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col justify-between mb-4">
              <div>
                <p className="text-xs text-gray-500">Total Consumption</p>
                <p className="text-lg font-bold text-indigo-600">
                  {totalGlazeConsumption.toFixed(2)}
                </p>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500">Total Line Loss</p>
                <p className="text-lg font-bold text-indigo-600">
                  {totalGlazeLoss.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md rounded-xl border-0 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Glaze Consumption by Size
            </CardTitle>
          </CardHeader>
          <CardContent>
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

      {/* Fuel Consumption */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-5">
        <Card className="shadow-md rounded-xl border-0 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Fuel Consumption
            </CardTitle>
          </CardHeader>
          <div className="flex flex-col justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500">Total Fuel Consumption</p>
              <p className="text-lg font-bold text-indigo-600">
                {totalFuel.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Fuel Consumption by Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="p-2 text-left">Size</th>
                  <th className="p-2 text-right">Fuel Consumption</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(fuelBySize).length > 0 ? (
                  Object.entries(fuelBySize).map(([size, value], idx) => (
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
                    <td colSpan="2" className="p-2 text-center text-gray-400">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
      {/* Gas Consumption */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-5">
        {/* Gas Summary */}
        <Card className="shadow-md rounded-xl border-0 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Gas Consumption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-4">
              {/* <div>
                <p className="text-xs text-gray-500">kcl / kg</p>
                <p className="text-lg font-bold text-indigo-600">
                  {kclPerKg ? kclPerKg.toFixed(2) : "0.00"}
                </p>
              </div> */}
              <div>
                <p className="text-xs text-gray-500">Total Gas Consumption</p>
                <p className="text-lg font-bold text-indigo-600">
                  {totalGas ? totalGas.toFixed(2) : "0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gas by Size */}
        <Card className="shadow-md rounded-xl border-0 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Gas Consumption by Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="p-2 text-left">Size</th>
                  <th className="p-2 text-right">Gas Consumption</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(gasBySize || {}).length > 0 ? (
                  Object.entries(gasBySize).map(([size, value], idx) => (
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
                    <td colSpan="2" className="p-2 text-center text-gray-400">
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
