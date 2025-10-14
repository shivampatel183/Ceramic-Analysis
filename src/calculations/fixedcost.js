export function calculateFixedCost(data) {
  let total = 0;
  let sizeWise = {};

  data.forEach((row) => {
    const rowTotal =
      Number(row.maintenance || 0) +
      Number(row.legal_illegal || 0) +
      Number(row.office || 0) +
      Number(row.diesel || 0) +
      Number(row.general_freight || 0);

    total += rowTotal;

    if (!sizeWise[row.size]) sizeWise[row.size] = 0;
    sizeWise[row.size] += rowTotal;
  });

  return { total, sizeWise };
}
