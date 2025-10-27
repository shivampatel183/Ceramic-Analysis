import { getSettingsForDate } from "./getSettings";

export function calculateGasConsumption(data, allCostHistory) {
  let totalGas = 0;
  let gasBySize = {};
  let totalKcl = 0;
  let totalWeight = 0;

  data.forEach((row) => {
    // 1. Find settings for this date
    const settings = getSettingsForDate(allCostHistory, row.date);
    if (!settings) return;

    // 2. Get rate from snapshot
    const rate = Number(settings.gas_rate_per_scm) || 0;

    // 3. Perform calculation
    const gas = Number(row.gas_consumption) || 0;
    const cost = gas * rate;

    totalGas += cost;
    if (!gasBySize[row.size]) {
      gasBySize[row.size] = 0;
    }
    gasBySize[row.size] += cost;

    const press_weight = Number(row.green_box_weight) || 0;
    const press_box = Number(row.press_box) || 0;
    const total_weight_kg = press_weight * press_box;
    if (total_weight_kg > 0) {
      totalKcl += (gas * 8500) / total_weight_kg;
      totalWeight += 1;
    }
  });

  const kclPerKg = totalWeight > 0 ? totalKcl / totalWeight : 0;

  return { totalGas, gasBySize, kclPerKg };
}
