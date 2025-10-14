import { supabase } from "../supabaseClient";
import { calculateFinalResult } from "./finalresult";
import { calculatePowderConsumption } from "./powder";
import { calculateGlazeConsumption } from "./glaze";
import { calculateFuelConsumption } from "./fuel";
import { calculateGasConsumption } from "./gas";
import { calculateElectricityCost } from "./electricity";
import { calculatePackingCost } from "./packing";
import { calculateFixedCost } from "./fixedcost";
import { calculateInkCost } from "./inkcost";
import {
  calculateProductionBySize,
  calculateNetProduction,
} from "./netProduction";

export async function fetchFinalResultHistory(range = "week") {
  const results = [];
  const today = new Date();
  let days = 7;
  if (range === "day") days = 1;
  else if (range === "week") days = 7;
  else if (range === "month") days = 30;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().split("T")[0];

    // Fetch all raw data for a single day
    const { data: productionData, error } = await supabase
      .from("production_data")
      .select("*")
      .eq("date", iso);

    if (error || !productionData || productionData.length === 0) {
      results.push({ date: iso, total: {} });
      continue;
    }

    // Perform all calculations for that day
    const powder = calculatePowderConsumption(productionData);
    const glaze = calculateGlazeConsumption(productionData);
    const fuel = calculateFuelConsumption(productionData);
    const gas = calculateGasConsumption(productionData);
    const electricity = calculateElectricityCost(productionData);
    const packing = calculatePackingCost(productionData);
    const fixed = calculateFixedCost(productionData);
    const ink = calculateInkCost(productionData);
    const netProductionResult = calculateNetProduction(productionData);
    const productionBySize = calculateProductionBySize(productionData);

    const finalResult = calculateFinalResult(
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

    results.push({
      date: iso,
      total: finalResult?.Total ?? {},
    });
  }

  return results;
}
