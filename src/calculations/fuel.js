import { getSettingsForDate } from "./getSettings";

export function calculateFuelConsumption(data, allCostHistory) {
  let totalFuel = 0;
  let fuelBySize = {};
  let totalCoalConsumption = 0;
  let totalProduction = 0;

  data.forEach((row) => {
    // 1. Find settings for this date
    const settings = getSettingsForDate(allCostHistory, row.date);
    if (!settings) return;

    // 2. Get rate from snapshot
    const rate = Number(settings.coal_rate_per_kg) || 0;

    // 3. Perform calculation
    const sprayDryerProd = Number(row.spray_dryer_production) || 0;
    const coalUnits = Number(row.coal_units_use) || 0;

    const fuelCost =
      (coalUnits / sprayDryerProd) * (sprayDryerProd * 1000) * rate;
    const validFuelCost = isNaN(fuelCost) || !isFinite(fuelCost) ? 0 : fuelCost;

    totalFuel += validFuelCost;
    if (!fuelBySize[row.size]) {
      fuelBySize[row.size] = 0;
    }
    fuelBySize[row.size] += validFuelCost;

    totalCoalConsumption += coalUnits;
    totalProduction += sprayDryerProd;
  });

  const coalConsumptionKgPerTon =
    totalProduction > 0 ? totalCoalConsumption / totalProduction : 0;

  return { totalFuel, fuelBySize, coalConsumptionKgPerTon };
}
