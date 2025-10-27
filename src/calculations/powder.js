import { getSettingsForDate } from "./getSettings";

export function calculatePowderConsumption(data, allCostHistory) {
  let total = 0;
  let sizeWise = {};

  data.forEach((row) => {
    // 1. Find settings for this date
    const settings = getSettingsForDate(allCostHistory, row.date);
    if (!settings) return;

    // 2. Get rate from snapshot
    const rate = Number(settings.body_cost_per_kg) || 0;

    // 3. Perform calculation
    const pressBox = Number(row.press_box) || 0;
    const greenWeight = Number(row.green_box_weight) || 0;

    const powderKg = pressBox * greenWeight * rate;

    total += powderKg;

    if (!sizeWise[row.size]) {
      sizeWise[row.size] = 0;
    }
    sizeWise[row.size] += powderKg;
  });

  return { total, sizeWise };
}
