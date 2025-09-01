import { supabase } from "../supabaseClient";

export async function fetchNetProduction(filter, applyDateFilter) {
  let query = supabase
    .from("production_data")
    .select("kiln_entry_box, packing_box, fired_loss_box, before_flow, date");

  query = applyDateFilter(query, filter);

  const { data } = await query;
  return calculateNetProduction(data);
}

function calculateNetProduction(data) {
  if (!data || data.length === 0) {
    return 0;
  }

  let total = 0;
  data.forEach((row) => {
    const kilnEntry = Number(row.kiln_entry_box) || 0;
    const packingBox = Number(row.packing_box) || 0;
    const kilnFiredLoss = Number(row.fired_loss_box) || 0;
    const sizingFiredLoss = Number(row.before_flow) || 0;

    const calc =
      kilnEntry -
      packingBox -
      (kilnEntry - packingBox - kilnFiredLoss - sizingFiredLoss) * 0.015;

    total += calc;
  });
  return total;
}

export async function fetchProductionBySize(filter, applyDateFilter) {
  let query = supabase
    .from("production_data")
    .select("size, kiln_entry_box, date");

  query = applyDateFilter(query, filter);

  const { data } = await query;
  return groupBySize(data);
}

function groupBySize(data) {
  if (!data || data.length === 0) {
    return [];
  }

  const grouped = {};
  data.forEach((row) => {
    const size = row.size;
    const production = Number(row.kiln_entry_box) || 0;
    grouped[size] = (grouped[size] || 0) + production;
  });

  return Object.entries(grouped).map(([size, total]) => ({ size, total }));
}
