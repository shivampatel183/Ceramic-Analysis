const bodyCostMap = {
  "600x600": 1.395,
  "200x1000": 1.395,
  "150x900": 1.395,
  "200x1200": 1.29,
  "400x400": 1.218,
};

export function calculatePowderConsumption(data) {
  if (!data || data.length === 0) {
    return { total: 0, sizeWise: {} };
  }

  let total = 0;
  let sizeWise = {};

  data.forEach((row) => {
    const size = row.size;
    const press = Number(row.press_box) || 0;
    const green = Number(row.green_box_weight) || 0;
    const bodyCost = bodyCostMap[size] || 0;

    const consumption = press * green * 1.05 * bodyCost;

    total += consumption;
    sizeWise[size] = (sizeWise[size] || 0) + consumption;
  });

  return { total, sizeWise };
}
