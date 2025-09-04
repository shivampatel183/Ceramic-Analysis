import { supabase } from "../supabaseClient";

export async function fetchNetProduction(filter, applyDateFilter) {
  let query = supabase
    .from("production_data")
    .select(
      "kiln_entry_box, packing_box, fired_loss_box, sizing_fire_loss_boxes, date"
    );

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
    const sizingFiredLoss = Number(row.sizing_fire_loss_boxes) || 0;
    const calc =
      packingBox +
      (kilnEntry - packingBox - kilnFiredLoss - sizingFiredLoss) -
      kilnEntry * 0.015;

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
  if (!data || data.length === 0) {
    return [];
  }

  const grouped = {};
  data.forEach((row) => {
    const size = row.size;
    const kilnEntry = Number(row.kiln_entry_box) || 0;
    const packingBox = Number(row.packing_box) || 0;
    const kilnFiredLoss = Number(row.fired_loss_box) || 0;
    const sizingFiredLoss = Number(row.sizing_fire_loss_boxes) || 0;
    const production =
      packingBox +
      (kilnEntry - packingBox - kilnFiredLoss - sizingFiredLoss) -
      kilnEntry * 0.015;
    grouped[size] = (grouped[size] || 0) + production;
    console.log(`${size}  ${production} ${grouped[size]}`);
  });

  return Object.entries(grouped).map(([size, total]) => ({ size, total }));
}
