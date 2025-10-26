import { getSettingsForDate } from "./getSettings";

export function calculateGlazeConsumption(data, allCostHistory) {
  let totalLoss = 0;
  let totalConsumption = 0;
  let sizeWise = {};

  data.forEach((row) => {
    // 1. Find settings for this date
    const settings = getSettingsForDate(allCostHistory, row.date);
    if (!settings) return;

    // 2. Get rates from snapshot
    const OP_RATE = Number(settings.glaze_rate_op) || 0;
    const VC_RATE = Number(settings.glaze_rate_vc) || 0;
    const ENGOBE_RATE = Number(settings.glaze_rate_engobe) || 0;

    // 3. Perform calculation (logic is unchanged)
    const beforeFlow = Number(row.before_flow) || 0;
    const kilnEntry = Number(row.kiln_entry_box) || 0;
    const greenWeight = Number(row.green_box_weight) || 0;

    const op = (greenWeight * 0.035 * 0.7) / 0.45;
    const vc = (greenWeight * 0.023 * 0.7) / 0.45;
    const engobe = (greenWeight * 0.035 * 0.7) / 0.4;

    const opLoss = (beforeFlow - kilnEntry) * op * OP_RATE;
    const vcLoss = (beforeFlow - kilnEntry) * vc * VC_RATE;
    const engobeLoss = (beforeFlow - kilnEntry) * engobe * ENGOBE_RATE;
    const loss = opLoss + vcLoss + engobeLoss;
    totalLoss += loss;

    const opConsumption = kilnEntry * op * OP_RATE;
    const vcConsumption = kilnEntry * vc * VC_RATE;
    const engobeConsumption = kilnEntry * engobe * ENGOBE_RATE;
    const consumption = opConsumption + vcConsumption + engobeConsumption;
    totalConsumption += consumption;

    if (!sizeWise[row.size]) {
      sizeWise[row.size] = { loss: 0, consumption: 0 };
    }
    sizeWise[row.size].loss += loss;
    sizeWise[row.size].consumption += consumption;
  });

  return { totalLoss, totalConsumption, sizeWise };
}
