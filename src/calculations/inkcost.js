const inkRates = {
  base: 500,
  brown: 500,
  black: 1150,
  blue: 1150,
  red: 1950,
  yellow: 1075,
  green: 800,
};

export function calculateInkCost(data) {
  let total = 0;
  let sizeWise = {};

  data.forEach((row) => {
    let rowInkCost = 0;

    Object.keys(inkRates).forEach((color) => {
      const value = Number(row[color]) || 0;
      rowInkCost += value * inkRates[color];
    });

    total += rowInkCost;

    if (!sizeWise[row.size]) sizeWise[row.size] = 0;
    sizeWise[row.size] += rowInkCost;
  });

  return { sizeWise, total };
}
