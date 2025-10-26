export function calculateFinalResult(
  powder,
  glaze,
  fuel,
  gas,
  electricity,
  packing,
  fixed,
  ink,
  productionBySize,
  netProduction
) {
  if (
    !productionBySize ||
    productionBySize.length === 0 ||
    netProduction === 0
  ) {
    return [];
  }

  // Get a unique list of all sizes that have production
  const allSizes = new Set([...productionBySize.map((p) => p.size)]);
  const result = [];

  for (const size of allSizes) {
    // Get the production total for this size
    const prod = productionBySize.find((p) => p.size === size)?.total || 0;

    // Skip any sizes that have no production
    if (prod === 0) continue;

    // --- 🚨 THIS IS THE FIX 🚨 ---
    // Instead of averaging the total, we get the *exact* cost for this size
    // from the 'sizeWise' (or 'fuelBySize'/'gasBySize') objects.

    const powderCost = powder.sizeWise[size] || 0;
    const glazeCost = glaze.sizeWise[size]?.consumption || 0; // glaze.js stores an object
    const fuelCost = fuel.fuelBySize[size] || 0; // fuel.js uses 'fuelBySize'
    const gasCost = gas.gasBySize[size] || 0; // gas.js uses 'gasBySize'
    const electricityCost = electricity.sizeWise[size] || 0;
    const packingCost = packing.sizeWise[size] || 0;
    const fixedCost = fixed.sizeWise[size] || 0;
    const inkCost = ink.sizeWise[size] || 0;
    // --- END OF FIX ---

    // Now, we sum the *actual* costs for this size
    const totalCost =
      powderCost +
      glazeCost +
      fuelCost +
      gasCost +
      electricityCost +
      packingCost +
      fixedCost +
      inkCost;

    const costPerUnit = totalCost / prod;

    // Add this size's data to the final result
    result.push({
      size,
      production: prod,
      totalCost,
      costPerUnit: isNaN(costPerUnit) ? 0 : costPerUnit,
      powder: powderCost,
      glaze: glazeCost,
      fuel: fuelCost,
      gas: gasCost,
      electricity: electricityCost,
      packing: packingCost,
      fixed: fixedCost,
      ink: inkCost,
    });
  }

  return result;
}
