import { supabase } from "../supabaseClient";

const glazeFactors = {
  "600x600": { loss: 14.8991, cons: 15.19427 },
  "200x1000": { loss: 16.19602, cons: 16.51994 },
  "150x900": { loss: 24.5, cons: 24.99 },
  "200x1200": { loss: 31.7746, cons: 32.4079 },
  "400x400": { loss: 6.75127, cons: 6.8862954 },
};

export async function fetchGlazeConsumption(filter, applyDateFilter) {
  let query = supabase
    .from("production_data")
    .select("size, kiln_entry_box, press_box, date");

  query = applyDateFilter(query, filter);

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching glaze data:", error);
    return { totalLoss: 0, totalConsumption: 0, sizeWise: {} };
  }

  let totalLoss = 0;
  let totalConsumption = 0;
  let sizeWise = {};

  data.forEach((row) => {
    const size = row.size;
    const kilnEntry = Number(row.kiln_entry_box) || 0;
    const beforeFlow = (Number(row.press_box) || 0) * 0.995;

    if (!glazeFactors[size]) return;

    const { loss, cons } = glazeFactors[size];

    const glazeLoss = (beforeFlow - kilnEntry) * loss;
    const glazeConsumption = beforeFlow * cons;
    totalLoss += glazeLoss;
    totalConsumption += glazeConsumption;

    sizeWise[size] = {
      loss: (sizeWise[size]?.loss || 0) + glazeLoss,
      consumption: (sizeWise[size]?.consumption || 0) + glazeConsumption,
    };
  });

  return { totalLoss, totalConsumption, sizeWise };
}
