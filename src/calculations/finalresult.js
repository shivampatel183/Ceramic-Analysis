// src/calculations/finalresult.js

// This function now takes all the pre-calculated data as arguments
export function calculateFinalResult(
  powderRaw,
  glazeRaw,
  fuelRaw,
  gasRaw,
  electricityRaw,
  packingRaw,
  fixedRaw,
  inkRaw,
  netproductionRaw,
  totalProduction
) {
  // Safe fallbacks with defaults
  const powder = {
    sizeWise: powderRaw?.sizeWise || {},
    total: powderRaw?.total || 0,
  };
  const glaze = {
    sizeWise: Object.fromEntries(
      Object.entries(glazeRaw?.sizeWise || {}).map(([size, val]) => [
        size,
        Number(val?.consumption) || 0,
      ])
    ),
    total: Number(glazeRaw?.totalConsumption) || 0,
  };
  const fuel = {
    sizeWise: fuelRaw?.fuelBySize || {},
    total: fuelRaw?.totalFuel || 0,
  };
  const gas = {
    sizeWise: gasRaw?.gasBySize || {},
    total: gasRaw?.totalGas || 0,
  };
  const electricity = {
    sizeWise: electricityRaw?.sizeWise || {},
    total: electricityRaw?.total || 0,
  };
  const packing = {
    sizeWise: packingRaw?.sizeWise || {},
    total: packingRaw?.total || 0,
  };
  const Fixed = {
    sizeWise: fixedRaw?.sizeWise || {},
    total: fixedRaw?.total || 0,
  };
  const ink = { sizeWise: inkRaw?.sizeWise || {}, total: inkRaw?.total || 0 };

  const sizes = [
    "600x600",
    "200x1000",
    "150x900",
    "200x1200",
    "400x400",
    "Total",
  ];

  const result = {
    Body: {},
    Glaze: {},
    Packing: {},
    Fuel: {},
    Gas: {},
    Electricity: {},
    Ink: {},
    Fixed: {},
    Total: {},
    SqFeetCost: {},
  };

  // Safe division function
  const safeDivide = (num, denom) => {
    const n = Number(num) || 0;
    const d = Number(denom) || 0;
    return d === 0 ? "0.00" : (n / d).toFixed(2);
  };

  const productiondata = Object.fromEntries(
    (netproductionRaw || []).map((row) => [row.size, row.total])
  );

  sizes.forEach((size) => {
    let costBody = 0,
      costGlaze = 0,
      costPacking = 0,
      costFuel = 0,
      costGas = 0,
      costElectricity = 0,
      costInk = 0,
      costFixed = 0;

    if (size === "Total") {
      const prod = Number(totalProduction) || 1;
      costBody = safeDivide(powder.total, prod);
      costGlaze = safeDivide(glaze.total, prod);
      costPacking = safeDivide(packing.total, prod);
      costFuel = safeDivide(fuel.total, prod);
      costGas = safeDivide(gas.total, prod);
      costElectricity = safeDivide(electricity.total, prod);
      costInk = safeDivide(ink.total, prod);
      costFixed = safeDivide(Fixed.total, prod);
    } else {
      const prod = Number(productiondata[size]) || 1;
      costBody = safeDivide(powder.sizeWise?.[size], prod);
      costGlaze = safeDivide(glaze.sizeWise?.[size], prod);
      costPacking = safeDivide(packing.sizeWise?.[size], prod);
      costFuel = safeDivide(fuel.sizeWise?.[size], prod);
      costGas = safeDivide(gas.sizeWise?.[size], prod);
      costElectricity = safeDivide(electricity.sizeWise?.[size], prod);
      costInk = safeDivide(ink.sizeWise?.[size], prod);
      costFixed = safeDivide(Fixed.sizeWise?.[size], prod);
    }

    result.Body[size] = costBody;
    result.Glaze[size] = costGlaze;
    result.Packing[size] = costPacking;
    result.Fuel[size] = costFuel;
    result.Gas[size] = costGas;
    result.Electricity[size] = costElectricity;
    result.Ink[size] = costInk;
    result.Fixed[size] = costFixed;

    result.Total[size] = (
      parseFloat(costBody) +
      parseFloat(costGlaze) +
      parseFloat(costPacking) +
      parseFloat(costFuel) +
      parseFloat(costGas) +
      parseFloat(costElectricity) +
      parseFloat(costInk) +
      parseFloat(costFixed)
    ).toFixed(2);

    result.SqFeetCost[size] = (parseFloat(result.Total[size]) / 8.6).toFixed(2);
  });

  return result;
}
