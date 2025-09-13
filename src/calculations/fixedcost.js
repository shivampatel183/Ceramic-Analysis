// calculations/fixedcost.js
import { supabase } from "../supabaseClient";

export async function fetchFixedCost(timeFilter, applyDateFilter) {
  let query = supabase
    .from("production_data") // 🔹 replace with actual table
    .select(
      "size, maintenance, legal_illegal, office, diesel, general_freight"
    );

  query = applyDateFilter(query, timeFilter);

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching fixed costs:", error);
    return { total: 0, sizeWise: {} };
  }

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
