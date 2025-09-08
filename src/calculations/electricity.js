// electricity.js
import { supabase } from "../supabaseClient";

const ELECTRICITY_RATE = 8.4;

const SIZE_MULTIPLIERS = {
  "600x600": 1.44,
  "200x1000": 1,
  "150x900": 1.08,
  "200x1200": 1.2,
  "400x400": 0.8,
};

export function calculateElectricityCost(data) {
  const sizeWise = {};
  let totalCost = 0;

  // ✅ Group by day
  const groupedByDay = {};

  data.forEach((row) => {
    const {
      date,
      size,
      kiln_entry_box = 0,
      fired_loss_box = 0,
      sizing_fire_loss_boxes = 0,
      daily_electricity_units_use = 0,
    } = row;

    if (!groupedByDay[date]) {
      groupedByDay[date] = { rows: [], units: daily_electricity_units_use };
    }

    groupedByDay[date].rows.push({
      size,
      kiln_entry_box,
      fired_loss_box,
      sizing_fire_loss_boxes,
    });
  });

  // ✅ For each day, distribute cost using sqm logic
  Object.values(groupedByDay).forEach(({ rows, units }) => {
    const dayCost = units * ELECTRICITY_RATE;
    totalCost += dayCost;

    // 1. calculate sqm for each size
    let totalSqm = 0;
    const rowSqm = [];

    rows.forEach(
      ({ size, kiln_entry_box, fired_loss_box, sizing_fire_loss_boxes }) => {
        const x = SIZE_MULTIPLIERS[size] || 1;
        const sqm =
          (kiln_entry_box - fired_loss_box - sizing_fire_loss_boxes) * x;
        rowSqm.push({ size, sqm });
        totalSqm += sqm;
      }
    );

    // 2. cost per sqm that day
    const unitCost = totalSqm > 0 ? dayCost / totalSqm : 0;

    // 3. distribute cost
    rowSqm.forEach(({ size, sqm }) => {
      const cost = sqm * unitCost;
      sizeWise[size] = (sizeWise[size] || 0) + cost;
    });
  });

  return { sizeWise, total: totalCost };
}

// Fetch from Supabase
export async function fetchElectricityCost(timeFilter, applyDateFilter) {
  try {
    let query = supabase
      .from("production_data")
      .select(
        "date, size, kiln_entry_box, fired_loss_box, sizing_fire_loss_boxes, daily_electricity_units_use"
      );

    query = applyDateFilter(query, timeFilter);

    const { data, error } = await query;

    if (error) {
      console.error("Supabase Error (electricity):", error.message);
      return { sizeWise: {}, total: 0 };
    }

    if (!data || data.length === 0) {
      return { sizeWise: {}, total: 0 };
    }

    console.log("✅ Electricity data:", data);
    return calculateElectricityCost(data);
  } catch (err) {
    console.error("Error fetching electricity cost:", err.message);
    return { sizeWise: {}, total: 0 };
  }
}
