import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// Import all calculation functions
import { calculatePowderConsumption } from "../calculations/powder";
import { calculateGlazeConsumption } from "../calculations/glaze";
import {
  calculateNetProduction,
  calculateProductionBySize,
} from "../calculations/netProduction";
import { calculateFuelConsumption } from "../calculations/fuel";
import { calculateGasConsumption } from "../calculations/gas";
import { calculateElectricityCost } from "../calculations/electricity";
import { calculatePackingCost } from "../calculations/packing";
import { calculateFixedCost } from "../calculations/fixedcost";
import { calculateInkCost } from "../calculations/inkcost";
import { calculateFinalResult } from "../calculations/finalresult";

// Import components
import SizeTableCard from "../components/SizeTableCard";
import StatCard from "../components/StatCard";
import FinalResultTable from "../components/FinalResultTable";

export default function Analysis() {
  const [analysisTimeFilter, setAnalysisTimeFilter] = useState(
    () => localStorage.getItem("analysisTimeFilter") || "day"
  );
  const [loading, setLoading] = useState(true);

  // States for results
  const [totalPowder, setTotalPowder] = useState(0);
  const [powderBySize, setPowderBySize] = useState({});
  const [totalGlazeLoss, setTotalGlazeLoss] = useState(0);
  const [totalGlazeConsumption, setTotalGlazeConsumption] = useState(0);
  const [glazeBySize, setGlazeBySize] = useState({});
  const [netProduction, setNetProduction] = useState(0);
  const [sizeData, setSizeData] = useState([]);
  const [totalFuel, setTotalFuel] = useState(0);
  const [fuelBySize, setFuelBySize] = useState({});
  const [coalConsumptionKgPerTon, setCoalConsumptionKgPerTon] = useState(0);
  const [totalGas, setTotalGas] = useState(0);
  const [gasBySize, setGasBySize] = useState({});
  const [kclPerKg, setKclPerKg] = useState(0);
  const [electricityCost, setElectricityCost] = useState({
    sizeWise: {},
    total: 0,
  });
  const [packingCost, setPackingCost] = useState({ sizeWise: {}, total: 0 });
  const [fixedCost, setFixedCost] = useState({ sizeWise: {}, total: 0 });
  const [inkCost, setInkCost] = useState({ sizeWise: {}, total: 0 });
  const [finalResult, setFinalResult] = useState(null);

  // 1. THIS STATE NOW HOLDS THE ENTIRE SETTINGS HISTORY
  const [allCostHistory, setAllCostHistory] = useState([]);

  // Date filter logic (unchanged)
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

  // Fetch production data (unchanged)
  async function fetchProductionData(filter, applyDateFilter) {
    let query = supabase.from("production_data").select("*");
    query = applyDateFilter(query, filter);
    const { data, error } = await query;
    if (error) {
      console.error("Error fetching production data:", error);
      return [];
    }
    return data || [];
  }

  // 2. THIS FUNCTION NOW FETCHES ALL COST HISTORY
  async function fetchAllCostHistory() {
    // We must fetch ALL history for the calculations to be correct
    const { data, error } = await supabase
      .from("cost_settings_history")
      .select("*");
    if (error) {
      console.error("Error fetching cost history:", error);
      return [];
    }
    return data;
  }

  useEffect(() => {
    localStorage.setItem("analysisTimeFilter", analysisTimeFilter);

    const runAnalysis = async () => {
      setLoading(true);

      // 3. FETCH BOTH DATASTREAMS
      const [productionData, costHistoryData] = await Promise.all([
        fetchProductionData(analysisTimeFilter, applyDateFilter),
        fetchAllCostHistory(),
      ]);

      setAllCostHistory(costHistoryData); // Save history to state

      if (productionData.length === 0) {
        // Reset all states... (unchanged)
        setTotalPowder(0);
        setPowderBySize({});
        setTotalGlazeLoss(0);
        setTotalGlazeConsumption(0);
        setGlazeBySize({});
        setNetProduction(0);
        setSizeData([]);
        setTotalFuel(0);
        setFuelBySize({});
        setCoalConsumptionKgPerTon(0);
        setTotalGas(0);
        setGasBySize({});
        setKclPerKg(0);
        setElectricityCost({ sizeWise: {}, total: 0 });
        setPackingCost({ sizeWise: {}, total: 0 });
        setFixedCost({ sizeWise: {}, total: 0 });
        setInkCost({ sizeWise: {}, total: 0 });
        setFinalResult(null);
        setLoading(false);
        return;
      }

      // 4. PASS 'costHistoryData' TO ALL CALCULATION FUNCTIONS
      const [
        powder,
        glaze,
        fuel,
        gas,
        electricity,
        packing,
        fixed,
        ink,
        netProductionResult,
        productionBySize,
      ] = [
        calculatePowderConsumption(productionData, costHistoryData),
        calculateGlazeConsumption(productionData, costHistoryData),
        calculateFuelConsumption(productionData, costHistoryData),
        calculateGasConsumption(productionData, costHistoryData),
        calculateElectricityCost(productionData, costHistoryData),
        calculatePackingCost(productionData, costHistoryData),
        calculateFixedCost(productionData, costHistoryData),
        calculateInkCost(productionData, costHistoryData),
        calculateNetProduction(productionData),
        calculateProductionBySize(productionData),
      ];

      const final = calculateFinalResult(
        powder,
        glaze,
        fuel,
        gas,
        electricity,
        packing,
        fixed,
        ink,
        productionBySize,
        netProductionResult
      );

      // 5. Set all state (unchanged)
      setTotalPowder(powder.total);
      setPowderBySize(powder.sizeWise);
      setTotalGlazeLoss(glaze.totalLoss);
      setTotalGlazeConsumption(glaze.totalConsumption);
      setGlazeBySize(glaze.sizeWise);
      setNetProduction(netProductionResult);
      setSizeData(productionBySize);
      setTotalFuel(fuel.totalFuel);
      setFuelBySize(fuel.fuelBySize);
      setCoalConsumptionKgPerTon(fuel.coalConsumptionKgPerTon);
      setTotalGas(gas.totalGas);
      setGasBySize(gas.gasBySize);
      setKclPerKg(gas.kclPerKg);
      setElectricityCost(electricity);
      setPackingCost(packing);
      setFixedCost(fixed);
      setInkCost(ink);
      setFinalResult(final);

      setLoading(false);
    };

    runAnalysis();
  }, [analysisTimeFilter]);

  // ... (rest of the file (return JSX) is unchanged) ...
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-gray-600">Loading analysis...</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      {/* ... (all JSX is unchanged) ... */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-gray-800">Production Analysis</h1>
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

      {finalResult ? (
        <FinalResultTable data={finalResult} />
      ) : (
        <p className="text-center text-gray-500 my-8">
          No data available for the selected period.
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <StatCard title="Gas Consumption" label="Total Gas" value={totalGas} />
        <SizeTableCard
          title="Gas by Size"
          data={gasBySize}
          columns={[{ label: "Size" }, { label: "Gas", align: "text-right" }]}
        />
      </div>

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
