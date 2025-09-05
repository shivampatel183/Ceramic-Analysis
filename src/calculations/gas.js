// gas.js
import { supabase } from "../supabaseClient";

// 🔹 Fetch Gas Consumption (total + size-wise)
export async function fetchGasConsumption(timeFilter, applyDateFilter) {
  try {
    let query = supabase.from("production_data").select("*");
    query = applyDateFilter(query, timeFilter);
    const { data, error } = await query;

    if (error) throw error;

    let totalGas = 0;
    let gasBySize = {};
    let kclPerKg = 0;

    data.forEach((row) => {
      const size = row.size;
      const kilnEntry = Number(row.kiln_entry_box) || 0;
      const greenBox = Number(row.green_box_weight) || 0;
      const gasConsumption = Number(row.gas_consumption) || 0;
      console.log(gasConsumption);

      // 🔹 kcl/kg
      const kclCalc = (gasConsumption * 8600) / (kilnEntry * greenBox + 1);

      // 🔹 gas consumption amount by size
      const sizeGasAmount = ((kclCalc * greenBox * kilnEntry) / 8600) * 45.5;

      // 🔹 total gas consumption amount
      const totalGasAmount = gasConsumption * 45.5;

      kclPerKg += kclCalc;
      totalGas += totalGasAmount;

      gasBySize[size] = (gasBySize[size] || 0) + sizeGasAmount;
    });

    return { totalGas, gasBySize, kclPerKg };
  } catch (err) {
    console.error("Error fetching gas consumption:", err.message);
    return { totalGas: 0, gasBySize: {}, kclPerKg: 0 };
  }
}
