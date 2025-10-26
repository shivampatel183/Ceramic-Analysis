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

// 1. Create a helper to get all data at once
async function getRequiredData(date) {
  // Get the logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not found");

  // Fetch production data for this user AND date
  const prodPromise = supabase
    .from("production_data")
    .select("*")
    .eq("date", date)
    .eq("user_id", user.id);

  // Fetch ALL cost history
  const settingsPromise = supabase
    .from("cost_settings_history")
    .select("*")
    .eq("user_id", user.id);

  const [prodResult, settingsResult] = await Promise.all([
    prodPromise,
    settingsPromise,
  ]);

  if (prodResult.error) throw prodResult.error;
  if (settingsResult.error) throw settingsResult.error;

  return {
    productionData: prodResult.data || [],
    allCostHistory: settingsResult.data || [],
  };
}

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

    try {
      // 2. Fetch all data using our new helper
      const { productionData, allCostHistory } = await getRequiredData(iso);

      if (!productionData || productionData.length === 0) {
        results.push({ date: iso, total: {} }); // Push empty data for this day
        continue;
      }

      // 3. Perform all calculations *with* cost history
      const powder = calculatePowderConsumption(productionData, allCostHistory);
      const glaze = calculateGlazeConsumption(productionData, allCostHistory);
      const fuel = calculateFuelConsumption(productionData, allCostHistory);
      const gas = calculateGasConsumption(productionData, allCostHistory);
      const electricity = calculateElectricityCost(
        productionData,
        allCostHistory
      );
      const packing = calculatePackingCost(productionData, allCostHistory);
      const fixed = calculateFixedCost(productionData, allCostHistory);
      const ink = calculateInkCost(productionData, allCostHistory);
      const netProductionResult = calculateNetProduction(productionData);
      const productionBySize = calculateProductionBySize(productionData);

      const finalResultArray = calculateFinalResult(
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

      // 4. Convert the finalResult array into the object structure the chart expects
      const finalResultObject = {};
      finalResultArray.forEach((item) => {
        finalResultObject[item.size] = {
          costPerUnit: item.costPerUnit,
          totalCost: item.totalCost,
        };
      });

      results.push({
        date: iso,
        total: finalResultObject, // Push the correctly formatted object
      });
    } catch (error) {
      console.error(`Error processing data for ${iso}:`, error);
      results.push({ date: iso, total: {} }); // Push empty data on error
    }
  }

  return results;
}
