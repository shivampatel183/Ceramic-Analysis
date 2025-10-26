import { getSettingsForDate } from "./getSettings";

export function calculateInkCost(data, allCostHistory) {
  let total = 0;
  let sizeWise = {};

  data.forEach((row) => {
    // 1. Find settings for this date
    const settings = getSettingsForDate(allCostHistory, row.date);
    if (!settings) return;

    // 2. Get rates from snapshot
    const INK_RATES = {
      base: Number(settings.ink_rate_base) || 0,
      brown: Number(settings.ink_rate_brown) || 0,
      black: Number(settings.ink_rate_black) || 0,
      blue: Number(settings.ink_rate_blue) || 0,
      red: Number(settings.ink_rate_red) || 0,
      yellow: Number(settings.ink_rate_yellow) || 0,
      green: Number(settings.ink_rate_green) || 0,
    };

    // 3. Perform calculation
    const cost =
      (Number(row.base) || 0) * INK_RATES.base +
      (Number(row.brown) || 0) * INK_RATES.brown +
      (Number(row.black) || 0) * INK_RATES.black +
      (Number(row.blue) || 0) * INK_RATES.blue +
      (Number(row.red) || 0) * INK_RATES.red +
      (Number(row.yellow) || 0) * INK_RATES.yellow +
      (Number(row.green) || 0) * INK_RATES.green;

    total += cost;
    if (!sizeWise[row.size]) {
      sizeWise[row.size] = 0;
    }
    sizeWise[row.size] += cost;
  });

  return { total, sizeWise };
}
