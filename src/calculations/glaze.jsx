// glazeCalc.js
export function calculateGlazeConsumption(data) {
  let totalLoss = 0;
  let totalConsumption = 0;
  let glazeBySize = {};

  data.forEach((row) => {
    const size = row.size;
    const kilnEntry = Number(row.kiln_entry_box) || 0;
    const beforeFlow = (Number(row.before_flow) || 0) * 0.95;

    // glaze factors map
    const glazeFactors = {
      "600x600": { loss: 14.8991, cons: 15.19427 },
      "200x1000": { loss: 16.19602, cons: 16.51994 },
      "150x900": { loss: 24.5, cons: 24.99 },
      "200x1200": { loss: 31.7746, cons: 32.4079 },
      "400x400": { loss: 6.75127, cons: 6.8862954 },
    };

    if (!glazeFactors[size]) return;

    const { loss, cons } = glazeFactors[size];

    const glazeLoss = (beforeFlow - kilnEntry) * loss;
    const glazeConsumption = beforeFlow * cons;

    totalLoss += glazeLoss;
    totalConsumption += glazeConsumption;

    glazeBySize[size] = {
      loss: (glazeBySize[size]?.loss || 0) + glazeLoss,
      consumption: (glazeBySize[size]?.consumption || 0) + glazeConsumption,
    };
  });

  return { totalLoss, totalConsumption, glazeBySize };
}
