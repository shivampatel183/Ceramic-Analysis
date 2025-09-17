import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { fetchPowderConsumption } from "../calculations/powder";
import { fetchGlazeConsumption } from "../calculations/glaze";
import {
  fetchNetProduction,
  fetchProductionBySize,
} from "../calculations/netProduction";
import { fetchFuelConsumption } from "../calculations/fuel";
import { fetchGasConsumption } from "../calculations/gas";
import { fetchElectricityCost } from "../calculations/electricity";
import { fetchPackingCost } from "../calculations/packing";
import { fetchFixedCost } from "../calculations/fixedcost";
import { fetchInkCost } from "../calculations/inkcost";
import SizeTableCard from "../components/SizeTableCard";
import StatCard from "../components/StatCard";
import FinalResultTable from "../components/FinalResultTable";
import { fetchFinalResult } from "../calculations/finalresult";

export default function Analysis() {
  const [analysisTimeFilter, setAnalysisTimeFilter] = useState(
    () => localStorage.getItem("analysisTimeFilter") || "day"
  );

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

  // electricity states
  const [electricityCost, setElectricityCost] = useState({
    sizeWise: {},
    total: 0,
  });
  // packing states
  const [packingCost, setPackingCost] = useState({
    sizeWise: {},
    total: 0,
  });

  // fixedCost
  const [fixedCost, setFixedCost] = useState({
    sizeWise: {},
    total: 0,
  });

  // ink cost states
  const [inkCost, setInkCost] = useState({ sizeWise: {}, total: 0 });

  // final result
  const [finalResult, setFinalResult] = useState(null);

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
    return query;
  }

  useEffect(() => {
    localStorage.setItem("analysisTimeFilter", analysisTimeFilter);
    const cacheKey = `analysisData_${analysisTimeFilter}`;
    const refreshFlag = localStorage.getItem("refreshData");
    if (refreshFlag === "true") {
      // Force refresh: clear cache and fetch new data
      localStorage.removeItem(cacheKey);
      localStorage.setItem("refreshData", "false");
    }
    const cache = localStorage.getItem(cacheKey);
    if (cache && refreshFlag !== "true") {
      try {
        const parsed = JSON.parse(cache);
        setTotalPowder(parsed.totalPowder);
        setPowderBySize(parsed.powderBySize);
        setTotalGlazeLoss(parsed.totalGlazeLoss);
        setTotalGlazeConsumption(parsed.totalGlazeConsumption);
        setGlazeBySize(parsed.glazeBySize);
        setNetProduction(parsed.netProduction);
        setSizeData(parsed.sizeData);
        setTotalFuel(parsed.totalFuel);
        setFuelBySize(parsed.fuelBySize);
        setCoalConsumptionKgPerTon(parsed.coalConsumptionKgPerTon);
        setTotalGas(parsed.totalGas);
        setGasBySize(parsed.gasBySize);
        setKclPerKg(parsed.kclPerKg);
        setElectricityCost(parsed.electricityCost);
        setPackingCost(parsed.packingCost);
        setFixedCost(parsed.fixedCost);
        setInkCost(parsed.inkCost);
        setFinalResult(parsed.finalResult);
        return;
      } catch (e) {
        // If cache is corrupted, ignore and fetch fresh
      }
    }
    (async () => {
      const powder = await fetchPowderConsumption(analysisTimeFilter, applyDateFilter);
      setTotalPowder(powder.total);
      setPowderBySize(powder.sizeWise);
      const glaze = await fetchGlazeConsumption(analysisTimeFilter, applyDateFilter);
      setTotalGlazeLoss(glaze.totalLoss);
      setTotalGlazeConsumption(glaze.totalConsumption);
      setGlazeBySize(glaze.sizeWise);
      const net = await fetchNetProduction(analysisTimeFilter, applyDateFilter);
      setNetProduction(net);
      const size = await fetchProductionBySize(analysisTimeFilter, applyDateFilter);
      setSizeData(size);
      const fuel = await fetchFuelConsumption(analysisTimeFilter, applyDateFilter);
      setTotalFuel(fuel.totalFuel);
      setFuelBySize(fuel.fuelBySize);
      setCoalConsumptionKgPerTon(fuel.coalConsumptionKgPerTon);
      const gas = await fetchGasConsumption(analysisTimeFilter, applyDateFilter);
      setTotalGas(gas.totalGas);
      setGasBySize(gas.gasBySize);
      setKclPerKg(gas.kclPerKg);
      const electricity = await fetchElectricityCost(analysisTimeFilter, applyDateFilter);
      setElectricityCost(electricity);
      const packing = await fetchPackingCost(analysisTimeFilter, applyDateFilter);
      setPackingCost(packing);
      const fixed = await fetchFixedCost(analysisTimeFilter, applyDateFilter);
      setFixedCost(fixed);
      const ink = await fetchInkCost(analysisTimeFilter, applyDateFilter);
      setInkCost(ink);
      const data = await fetchFinalResult(analysisTimeFilter, applyDateFilter);
      setFinalResult(data);
      // Save to cache
      localStorage.setItem(cacheKey, JSON.stringify({
        totalPowder: powder.total,
        powderBySize: powder.sizeWise,
        totalGlazeLoss: glaze.totalLoss,
        totalGlazeConsumption: glaze.totalConsumption,
        glazeBySize: glaze.sizeWise,
        netProduction: net,
        sizeData: size,
        totalFuel: fuel.totalFuel,
        fuelBySize: fuel.fuelBySize,
        coalConsumptionKgPerTon: fuel.coalConsumptionKgPerTon,
        totalGas: gas.totalGas,
        gasBySize: gas.gasBySize,
        kclPerKg: gas.kclPerKg,
        electricityCost: electricity,
        packingCost: packing,
        fixedCost: fixed,
        inkCost: ink,
        finalResult: data
      }));
    })();
  }, [analysisTimeFilter]);

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-700">
          📊 Production Analysis
        </h2>

        <select
          value={analysisTimeFilter}
          onChange={(e) => setAnalysisTimeFilter(e.target.value)}
          className="text-sm font-medium border border-indigo-200 rounded px-4 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        >
          <option value="day">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* final result table */}
      {finalResult && <FinalResultTable data={finalResult} />}

      {/* Net Production */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <StatCard
          title="Net Production"
          label="Total Units"
          value={netProduction}
        />
        <SizeTableCard
          title="Production by Size"
          data={Object.fromEntries(
            sizeData.map((row) => [row.size, row.total])
          )}
          columns={[
            { label: "Size" },
            { label: "Total Production", align: "text-right" },
          ]}
        />
      </div>

      {/* Powder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <StatCard
          title="Total Powder Consumption"
          label="Total Powder"
          value={totalPowder}
          unit="Kg"
        />
        <SizeTableCard
          title="Powder Consumption by Size"
          data={powderBySize}
          columns={[
            { label: "Size" },
            { label: "Consumption (Kg)", align: "text-right" },
          ]}
        />
      </div>

      {/* Glaze */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <StatCard
          title="Glaze Consumption"
          label="Total Consumption"
          value={totalGlazeConsumption}
          extra={
            <div>
              <p className="text-xs text-gray-500">Total Line Loss</p>
              <p className="text-lg font-bold text-indigo-600">
                {totalGlazeLoss.toFixed(2)}
              </p>
            </div>
          }
        />
        <SizeTableCard
          title="Glaze by Size"
          data={Object.fromEntries(
            Object.entries(glazeBySize).map(([size, values]) => [
              size,
              [values.loss, values.consumption],
            ])
          )}
          columns={[
            { label: "Size" },
            { label: "Line Loss", align: "text-right" },
            { label: "Consumption", align: "text-right" },
          ]}
        />
      </div>

      {/* Fuel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <StatCard
          title="Fuel Consumption"
          label="Total Fuel"
          value={totalFuel}
        />
        <SizeTableCard
          title="Fuel by Size"
          data={fuelBySize}
          columns={[{ label: "Size" }, { label: "Fuel", align: "text-right" }]}
        />
      </div>

      {/* Gas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <StatCard title="Gas Consumption" label="Total Gas" value={totalGas} />
        <SizeTableCard
          title="Gas by Size"
          data={gasBySize}
          columns={[{ label: "Size" }, { label: "Gas", align: "text-right" }]}
        />
      </div>

      {/* Electricity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <StatCard
          title="Electricity Cost"
          label="Total Electricity"
          value={electricityCost.total}
          unit="₹"
        />
        <SizeTableCard
          title="Electricity by Size"
          data={electricityCost.sizeWise}
          columns={[
            { label: "Size" },
            { label: "Cost (₹)", align: "text-right" },
          ]}
        />
      </div>

      {/* Packing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <StatCard
          title="Packing Cost"
          label="Total Packing"
          value={packingCost.total}
          unit="₹"
        />
        <SizeTableCard
          title="Packing by Size"
          data={packingCost.sizeWise}
          columns={[
            { label: "Size" },
            { label: "Cost (₹)", align: "text-right" },
          ]}
        />
      </div>

      {/* Fixed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <StatCard
          title="Fixed Cost"
          label="Total Fixed"
          value={fixedCost.total}
          unit="₹"
        />
        <SizeTableCard
          title="Fixed Cost by Size"
          data={fixedCost.sizeWise}
          columns={[
            { label: "Size" },
            { label: "Cost (₹)", align: "text-right" },
          ]}
        />
      </div>

      {/* Ink */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <StatCard
          title="Ink Cost"
          label="Total Ink"
          value={inkCost.total}
          unit="₹"
        />
        <SizeTableCard
          title="Ink Cost by Size"
          data={inkCost.sizeWise}
          columns={[
            { label: "Size" },
            { label: "Cost (₹)", align: "text-right" },
          ]}
        />
      </div>
    </div>
  );
}
