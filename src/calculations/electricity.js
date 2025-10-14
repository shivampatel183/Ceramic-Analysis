const ELECTRICITY_RATE = 8.4;

const SIZE_MULTIPLIERS = {
  "600x600": 1.44,
  "200x1000": 1,
  "150x900": 1.08,
  "200x1200": 1.2,
  "400x400": 0.8,
};

export function calculateElectricityCost(data) {
  if (!data || data.length === 0) {
    return { sizeWise: {}, total: 0 };
  }

  const sizeWise = {};
  let totalCost = 0;

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

    const kiln = Number(kiln_entry_box) || 0;
    const fired = Number(fired_loss_box) || 0;
    const sizing = Number(sizing_fire_loss_boxes) || 0;
    const units = Number(daily_electricity_units_use) || 0;

    if (!groupedByDay[date]) {
      groupedByDay[date] = { rows: [], units: units };
    } else {
      groupedByDay[date].units = (groupedByDay[date].units || 0) + units;
    }

    groupedByDay[date].rows.push({
      size,
      kiln_entry_box: kiln,
      fired_loss_box: fired,
      sizing_fire_loss_boxes: sizing,
    });
  });

  Object.values(groupedByDay).forEach(({ rows, units }) => {
    const dayCost = units * ELECTRICITY_RATE;
    totalCost += dayCost;

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

    const unitCost = totalSqm > 0 ? dayCost / totalSqm : 0;

    rowSqm.forEach(({ size, sqm }) => {
      const cost = sqm * unitCost;
      sizeWise[size] = (sizeWise[size] || 0) + cost;
    });
  });

  Object.keys(sizeWise).forEach((k) => {
    sizeWise[k] = Number(sizeWise[k].toFixed(2));
  });

  return { sizeWise, total: Number(totalCost.toFixed(2)) };
}
