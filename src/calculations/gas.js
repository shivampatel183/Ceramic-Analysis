// constants
const GAS_RATE = 45.5;
const KCL_FACTOR = 8600;

export function calculateGasConsumption(data) {
  if (!data || data.length === 0) {
    return { totalGas: 0, gasBySize: {}, kclPerKg: 0 };
  }

  const groupedByDate = {};
  data.forEach((row) => {
    const date = row.date;
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push(row);
  });

  let totalGas = 0;
  let gasBySize = {};
  let totalKclPerKg = 0;
  let dayCount = 0;

  Object.values(groupedByDate).forEach((rows) => {
    const dailyGas = rows.reduce(
      (sum, r) => sum + (Number(r.gas_consumption) || 0),
      0
    );
    const dailyTotal = dailyGas * GAS_RATE;

    let denom = 0;
    const sizeValues = {};
    rows.forEach((r) => {
      const kilnEntry = Number(r.kiln_entry_box) || 0;
      const greenBox = Number(r.green_box_weight) || 0;
      const value = kilnEntry * greenBox;
      sizeValues[r.size] = (sizeValues[r.size] || 0) + value;
      denom += value;
    });

    Object.entries(sizeValues).forEach(([size, value]) => {
      const share = denom > 0 ? (value / denom) * dailyTotal : 0;
      gasBySize[size] = (gasBySize[size] || 0) + share;
    });

    if (denom > 0) {
      const dailyKcl = (dailyGas * KCL_FACTOR) / denom;
      totalKclPerKg += dailyKcl;
      dayCount++;
    }

    totalGas += dailyTotal;
  });

  const avgKclPerKg = dayCount > 0 ? totalKclPerKg / dayCount : 0;

  return { totalGas, gasBySize, kclPerKg: avgKclPerKg };
}
