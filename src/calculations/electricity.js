import { getSettingsForDate } from "./getSettings";

export function calculateElectricityCost(data, allCostHistory) {
  let total = 0;
  let sizeWise = {};

  data.forEach((row) => {
    // 1. Find the correct settings snapshot for this row's date
    const settings = getSettingsForDate(allCostHistory, row.date);
    if (!settings) return; // Skip if no settings exist for this date

    // 2. Get the rate from that snapshot
    const rate = Number(settings.electricity_rate_per_unit) || 0;

    // 3. Perform calculation
    const dailyUnits = Number(row.daily_electricity_units_use) || 0;
    const cost = dailyUnits * rate;

    total += cost;

    if (!sizeWise[row.size]) {
      sizeWise[row.size] = 0;
    }
    sizeWise[row.size] += cost;
  });

  return { total, sizeWise };
}
