import { fetchPowderConsumption } from "./powder";
import { fetchGlazeConsumption } from "./glaze";
import { fetchFuelConsumption } from "./fuel";
import { fetchGasConsumption } from "./gas";
import { fetchElectricityCost } from "./electricity";
import { fetchPackingCost } from "./packing";
import { fetchFixedCost } from "./fixedcost";
import { fetchInkCost } from "./inkcost";
import { fetchNetProduction } from "./netProduction";
/**
 * Collects and calculates all cost data into a final summary
 */
export async function fetchFinalResult(timeFilter, applyDateFilter) {
  // Call all calculations in parallel (with safe fallback)
  const [
    powder = { sizeWise: {}, total: 0 },
    glaze = { sizeWise: {}, total: 0 },
    fuel = { sizeWise: {}, total: 0 },
    gas = { sizeWise: {}, total: 0 },
    electricity = { sizeWise: {}, total: 0 },
    packing = { sizeWise: {}, total: 0 },
    fixed = { sizeWise: {}, total: 0 },
    ink = { sizeWise: {}, total: 0 },
  ] = await Promise.all([
    fetchPowderConsumption(timeFilter, applyDateFilter),
    fetchGlazeConsumption(timeFilter, applyDateFilter),
    fetchFuelConsumption(timeFilter, applyDateFilter),
    fetchGasConsumption(timeFilter, applyDateFilter),
    fetchElectricityCost(timeFilter, applyDateFilter),
    fetchPackingCost(timeFilter, applyDateFilter),
    fetchFixedCost(timeFilter, applyDateFilter),
    fetchInkCost(timeFilter, applyDateFilter),
  ]);

  // ✅ Expanded size list
  const sizes = ["600x600", "200x1000", "150x900", "200x1200", "400x400"];

  // Initialize result structure
  const result = {
    Body: {},
    Glaze: {},
    Packing: {},
    Fuel: {},
    Gas: {},
    Electricity: {},
    Ink: {},
    fixed: {},
    Total: {},
  };

  const netproductionArr = await fetchNetProduction(
    timeFilter,
    applyDateFilter
  ).catch(() => []);
  const netproduction = {
    sizeWise: netproductionArr.reduce((acc, { size, total }) => {
      acc[size] = total;
      return acc;
    }, {}),
    total: netproductionArr.reduce((sum, { total }) => sum + total, 0),
  };

  console.log({
    powder,
    glaze,
    fuel,
    gas,
    electricity,
    packing,
    fixed,
    ink,
    netproduction,
  });

  return result;
}
