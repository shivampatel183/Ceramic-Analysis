export function calculateFixedCost(data) {
  if (!data || data.length === 0) {
    return { total: 0, sizeWise: {} };
  }

  // Group all data by date, just like in the gas/electricity calculations
  const groupedByDate = {};
  data.forEach((row) => {
    const date = row.date;
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push(row);
  });

  let totalCost = 0;
  let sizeWiseCost = {};

  // Process one day at a time
  Object.values(groupedByDate).forEach((rows) => {
    // 1. Calculate the TOTAL fixed cost for this day.
    // We sum all rows in case the cost was entered on more than one.
    const dailyTotal = rows.reduce(
      (sum, r) =>
        sum +
        (Number(r.maintenance) || 0) +
        (Number(r.legal_illegal) || 0) +
        (Number(r.office) || 0) +
        (Number(r.diesel) || 0) +
        (Number(r.general_freight) || 0),
      0
    );

    totalCost += dailyTotal;

    // 2. Find the production proportion for each size on this day.
    // This logic is copied from gas.js to get a production-based denominator.
    let denom = 0;
    const sizeValues = {};
    rows.forEach((r) => {
      const kilnEntry = Number(r.kiln_entry_box) || 0;
      const greenBox = Number(r.green_box_weight) || 0;
      const value = kilnEntry * greenBox; // Use production weight as the basis for distribution
      sizeValues[r.size] = (sizeValues[r.size] || 0) + value;
      denom += value;
    });

    // 3. Distribute the single dailyTotal fixed cost based on production share
    Object.entries(sizeValues).forEach(([size, value]) => {
      const share = denom > 0 ? (value / denom) * dailyTotal : 0;
      sizeWiseCost[size] = (sizeWiseCost[size] || 0) + share;
    });
  });

  // Round the final numbers for clean output
  Object.keys(sizeWiseCost).forEach((k) => {
    sizeWiseCost[k] = Number(sizeWiseCost[k].toFixed(2));
  });

  return { total: Number(totalCost.toFixed(2)), sizeWise: sizeWiseCost };
}
