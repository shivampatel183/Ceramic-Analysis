import { getSettingsForDate } from "./getSettings";

// --- (Keep your helper functions 'getNetProductionBoxes' and 'getSizeSqm') ---
function getNetProductionBoxes(row) {
  const kilnEntry = Number(row.kiln_entry_box) || 0;
  const packingBox = Number(row.packing_box) || 0;
  const kilnFiredLoss = Number(row.fired_loss_box) || 0;
  const sizingFiredLoss = Number(row.sizing_fire_loss_boxes) || 0;
  const boxes =
    packingBox +
    (kilnEntry - packingBox - kilnFiredLoss - sizingFiredLoss) -
    kilnEntry * 0.015;
  return boxes;
}
function getSizeSqm(size) {
  if (!size || typeof size !== "string") return 0;
  const dimensions = size.split("x");
  if (dimensions.length !== 2) return 0;
  const widthInMeters = Number(dimensions[0]) / 1000;
  const heightInMeters = Number(dimensions[1]) / 1000;
  if (isNaN(widthInMeters) || isNaN(heightInMeters)) return 0;
  return widthInMeters * heightInMeters;
}
// -------------------------------------------------------------------------

export function calculateFixedCost(data, allCostHistory) {
  let total = 0;
  let sizeWise = {};

  // Group data by date
  const dailyData = {};
  data.forEach((row) => {
    const date = row.date;
    if (!date) return; // Skip rows with no date

    if (!dailyData[date]) {
      // Find the settings snapshot for this day
      const settings = getSettingsForDate(allCostHistory, date);

      let dailyCost = 0;
      if (settings) {
        // Get the monthly costs from that snapshot
        const monthlyTotal =
          (Number(settings.monthly_salary) || 0) +
          (Number(settings.monthly_maintenance) || 0) +
          (Number(settings.monthly_interest_legal) || 0) +
          (Number(settings.monthly_admin_others) || 0);

        // Use 30 as a standard number of days for simplicity
        dailyCost = monthlyTotal / 30;
      }

      dailyData[date] = {
        rows: [],
        totalSqmDay: 0,
        totalDailyFixedCost: dailyCost, // The calculated daily cost for THIS date
      };
    }

    // Calculate SQM for the row
    const netBoxes = getNetProductionBoxes(row);
    const sqmPerBox = getSizeSqm(row.size);
    const sqm = netBoxes * sqmPerBox;

    dailyData[date].rows.push({ ...row, sqm });
    dailyData[date].totalSqmDay += sqm;
  });

  // Allocate daily cost to each row
  Object.keys(dailyData).forEach((date) => {
    const day = dailyData[date];

    // Skip if no production or no cost was found for this day
    if (day.totalSqmDay <= 0 || day.totalDailyFixedCost === 0) return;

    day.rows.forEach((row) => {
      if (!sizeWise[row.size]) sizeWise[row.size] = 0;

      const sqmPercentage = row.sqm / day.totalSqmDay;
      const allocatedCost = day.totalDailyFixedCost * sqmPercentage;

      total += allocatedCost;
      sizeWise[row.size] += allocatedCost;
    });
  });

  return { total, sizeWise };
}
