import { getSettingsForDate } from "./getSettings";

export function calculatePackingCost(data, allCostHistory) {
  let total = 0;
  let sizeWise = {};

  data.forEach((row) => {
    // 1. Find settings for this date
    const settings = getSettingsForDate(allCostHistory, row.date);
    if (!settings) return;

    // 2. Get rates from snapshot
    const premRate = Number(settings.prem_box_rate) || 0;
    const stdEcoRate = Number(settings.std_eco_box_rate) || 0;
    const cornerRate = Number(settings.corner_paper_stapping_rate) || 0;

    // 3. Perform calculation
    const premBox = Number(row.pre_box) || 0;
    const stdBox = Number(row.std_box) || 0;
    const ecoBox = Number(row.eco_box) || 0;
    const packingBox = Number(row.packing_box) || 0;

    const cost =
      premBox * premRate +
      (stdBox + ecoBox) * stdEcoRate +
      packingBox * cornerRate;

    total += cost;
    if (!sizeWise[row.size]) {
      sizeWise[row.size] = 0;
    }
    sizeWise[row.size] += cost;
  });

  return { total, sizeWise };
}
