const PACKING_RATES = {
  "600x600": { packing_rate: 1.75, std_eco_rate: 8.7, pre_rate: 9.1 },
  "200x1000": { packing_rate: 1.9, std_eco_rate: 9.8, pre_rate: 10 },
  "150x900": { packing_rate: 1.75, std_eco_rate: 7, pre_rate: 7.1 },
  "200x1200": { packing_rate: 1.75, std_eco_rate: 8.98, pre_rate: 9.08 },
  "400x400": { packing_rate: 1.0, std_eco_rate: 5.7, pre_rate: 5.7 },
};

export function calculatePackingCost(data) {
  if (!data || data.length === 0) {
    return { sizeWise: {}, total: 0 };
  }

  let sizeWise = {};
  let total = 0;

  data.forEach(
    ({ size, packing_box = 0, std_box = 0, eco_box = 0, pre_box = 0 }) => {
      const rates = PACKING_RATES[size] || {
        packing_rate: 0,
        std_eco_rate: 0,
        pre_rate: 0,
      };

      const base =
        Number(packing_box) * rates.packing_rate +
        (Number(std_box) + Number(eco_box)) * rates.std_eco_rate +
        Number(pre_box) * rates.pre_rate;

      const cost = base * 1.03; // applying 103%

      sizeWise[size] = (sizeWise[size] || 0) + cost;
      total += cost;
    }
  );

  return { sizeWise, total };
}
