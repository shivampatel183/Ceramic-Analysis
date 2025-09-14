import { fetchFinalResult } from "./finalresult";

export async function fetchFinalResultHistory(range = "week", applyDateFilter) {
  const results = [];
  const today = new Date();
  let days = 7;
  if (range === "day") days = 1;
  else if (range === "week") days = 7;
  else if (range === "month") days = 30;
  else if (range === "all") days = 90;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    const singleDayFilter = (query) => query.eq("date", iso);
    const res = await fetchFinalResult("day", singleDayFilter);
    results.push({ date: iso, result: res });
  }
  console.log("Final Result History:", results);
  return results;
}
