import { fetchPowderConsumption } from "./powder";
import { fetchGlazeConsumption } from "./glaze";
import { fetchFuelConsumption } from "./fuel";
import { fetchGasConsumption } from "./gas";
import { fetchElectricityCost } from "./electricity";
import { fetchPackingCost } from "./packing";
import { fetchFixedCost } from "./fixedcost";
import { fetchInkCost } from "./inkcost";
import { fetchProductionBySize, fetchNetProduction } from "./netProduction";

export async function fetchFinalResult(timeFilter, applyDateFilter) {
  const [
    powderRaw,
    glazeRaw,
    fuelRaw,
    gasRaw,
    electricityRaw,
    packingRaw,
    fixedRaw,
    inkRaw,
    netproductionRaw,
  ] = await Promise.all([
    fetchPowderConsumption(timeFilter, applyDateFilter),
    fetchGlazeConsumption(timeFilter, applyDateFilter),
    fetchFuelConsumption(timeFilter, applyDateFilter),
    fetchGasConsumption(timeFilter, applyDateFilter),
    fetchElectricityCost(timeFilter, applyDateFilter),
    fetchPackingCost(timeFilter, applyDateFilter),
    fetchFixedCost(timeFilter, applyDateFilter),
    fetchInkCost(timeFilter, applyDateFilter),
    fetchProductionBySize(timeFilter, applyDateFilter),
  ]);

  // ✅ Safe fallback with defaults
  const powder = {
    sizeWise: powderRaw?.sizeWise || {},
    total: powderRaw?.total || 0,
  };
  const glaze = {
    sizeWise: Object.fromEntries(
      Object.entries(glazeRaw?.sizeWise || {}).map(([size, val]) => [
        size,
        Number(val?.consumption) || 0,
      ])
    ),
    total: Number(glazeRaw?.totalConsumption) || 0,
  };

  const fuel = {
    sizeWise: fuelRaw?.fuelBySize || {},
    total: fuelRaw?.totalFuel || 0,
  };

  const gas = {
    sizeWise: gasRaw?.gasBySize || {},
    total: gasRaw?.totalGas || 0,
  };
  const electricity = {
    sizeWise: electricityRaw?.sizeWise || {},
    total: electricityRaw?.total || 0,
  };
  const packing = {
    sizeWise: packingRaw?.sizeWise || {},
    total: packingRaw?.total || 0,
  };
  const Fixed = {
    sizeWise: fixedRaw?.sizeWise || {},
    total: fixedRaw?.total || 0,
  };
  const ink = { sizeWise: inkRaw?.sizeWise || {}, total: inkRaw?.total || 0 };

  const sizes = [
    "600x600",
    "200x1000",
    "150x900",
    "200x1200",
    "400x400",
    "Total",
  ];

  const result = {
    Body: {},
    Glaze: {},
    Packing: {},
    Fuel: {},
    Gas: {},
    Electricity: {},
    Ink: {},
    Fixed: {},
    Total: {},
    SqFeetCost: {},
  };

  // ✅ Safe division
  const safeDivide = (num, denom) => {
    const n = Number(num) || 0;
    const d = Number(denom) || 0;
    return (n / d).toFixed(2) || "0.00";
  };

  // ✅ Convert production array to object { size: total }
  const productiondata = Object.fromEntries(
    (netproductionRaw || []).map((row) => [row.size, row.total])
  );

  const totalProduction = await fetchNetProduction(timeFilter, applyDateFilter);
  sizes.forEach((size) => {
    if (size === "Total") {
      const prod = Number(totalProduction) || 1;

      result.Body[size] = safeDivide(powder.total, prod || 1);
      result.Glaze[size] = safeDivide(glaze.total, prod || 1);
      result.Packing[size] = safeDivide(packing.total, prod || 1);
      result.Fuel[size] = safeDivide(fuel.total, prod || 1);
      result.Gas[size] = safeDivide(gas.total, prod || 1);
      result.Electricity[size] = safeDivide(electricity.total, prod || 1);
      result.Ink[size] = safeDivide(ink.total, prod || 1);
      result.Fixed[size] = safeDivide(Fixed.total, prod || 1);

      result.Total[size] = (
        (parseFloat(result.Body[size]) || 0) +
        (parseFloat(result.Glaze[size]) || 0) +
        (parseFloat(result.Packing[size]) || 0) +
        (parseFloat(result.Fuel[size]) || 0) +
        (parseFloat(result.Gas[size]) || 0) +
        (parseFloat(result.Electricity[size]) || 0) +
        (parseFloat(result.Ink[size]) || 0) +
        (parseFloat(result.Fixed[size]) || 0)
      ).toFixed(2);

      result.SqFeetCost[size] = safeDivide(result.Total[size] / 8.6, 1);
    } else {
      const prod = Number(productiondata[size]) || 1;

      result.Body[size] = safeDivide(powder.sizeWise?.[size], prod);
      result.Glaze[size] = safeDivide(glaze.sizeWise?.[size], prod);
      result.Packing[size] = safeDivide(packing.sizeWise?.[size], prod);
      result.Fuel[size] = safeDivide(fuel.sizeWise?.[size], prod);
      result.Gas[size] = safeDivide(gas.sizeWise?.[size], prod);
      result.Electricity[size] = safeDivide(electricity.sizeWise?.[size], prod);
      result.Ink[size] = safeDivide(ink.sizeWise?.[size], prod);
      result.Fixed[size] = safeDivide(Fixed.sizeWise?.[size], prod);

      result.Total[size] = (
        (parseFloat(result.Body[size]) || 0) +
        (parseFloat(result.Glaze[size]) || 0) +
        (parseFloat(result.Packing[size]) || 0) +
        (parseFloat(result.Fuel[size]) || 0) +
        (parseFloat(result.Gas[size]) || 0) +
        (parseFloat(result.Electricity[size]) || 0) +
        (parseFloat(result.Ink[size]) || 0) +
        (parseFloat(result.Fixed[size]) || 0)
      ).toFixed(2);

      result.SqFeetCost[size] = safeDivide(result.Total[size] / 8.6, 1);
    }
  });

  return result;
}
