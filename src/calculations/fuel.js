import { supabase } from "../supabaseClient";

export async function fetchFuelConsumption(filter, applyDateFilter) {
  let query = supabase
    .from("production_data")
    .select(
      "size, press_box, green_box_weight, coal_units_use, spray_dryer_production, date"
    );

  query = applyDateFilter(query, filter);

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching fuel data:", error);
    return { totalFuel: 0, fuelBySize: {}, coalConsumptionKgPerTon: 0 };
  }

  if (!data || data.length === 0) {
    return { totalFuel: 0, fuelBySize: {}, coalConsumptionKgPerTon: 0 };
  }

  let cumulativeCoal = 0;
  let cumulativeSprayDryer = 0;

  data.forEach((row) => {
    cumulativeCoal += Number(row.coal_units_use) || 0;
    cumulativeSprayDryer += Number(row.spray_dryer_production) || 0;
  });

  if (cumulativeSprayDryer === 0) {
    return { totalFuel: 0, fuelBySize: {}, coalConsumptionKgPerTon: 0 };
  }

  // ✅ Daily specific coal consumption (same for all sizes that day)
  const coalKgPerTon = (cumulativeCoal / cumulativeSprayDryer) * 1000 * 5.9;

  // ✅ First, calculate powder per size (not fuel yet)
  const sizeWisePowder = {};
  let totalPowder = 0;

  data.forEach((row) => {
    const size = row.size;
    const pressBox = Number(row.press_box) || 0;
    const greenWeight = Number(row.green_box_weight) || 0;

    const powder = pressBox * greenWeight * 1.05;
    sizeWisePowder[size] = (sizeWisePowder[size] || 0) + powder;
    totalPowder += powder;
  });

  // ✅ Now distribute daily fuel proportionally
  let sizeWiseFuel = {};
  let totalFuelConsumption = 0;

  Object.entries(sizeWisePowder).forEach(([size, powder]) => {
    const fuelShare = (powder / totalPowder) * (cumulativeCoal * 5.9); // distribute daily coal
    sizeWiseFuel[size] = fuelShare;
    totalFuelConsumption += fuelShare;
  });

  return {
    totalFuel: totalFuelConsumption,
    fuelBySize: sizeWiseFuel,
    coalConsumptionKgPerTon: coalKgPerTon,
  };
}
