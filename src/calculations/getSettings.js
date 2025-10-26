/**
 * Finds the correct settings snapshot for a specific date.
 * @param {Array} allCostHistory - The entire list of settings from the cost_settings_history table.
 * @param {string} targetDate - The date of the production row (e.g., '2024-10-25').
 * @returns {Object | null} The correct settings object, or null if none are found.
 */
export function getSettingsForDate(allCostHistory, targetDate) {
  if (!allCostHistory || allCostHistory.length === 0 || !targetDate) {
    return null;
  }

  // 1. Filter for snapshots that are *on or before* the target date
  const validSnapshots = allCostHistory.filter((snapshot) => {
    if (!snapshot.effective_date) return false;
    // Add 'T00:00:00' to ensure correct date parsing across timezones
    return (
      new Date(snapshot.effective_date + "T00:00:00") <= new Date(targetDate)
    );
  });

  if (validSnapshots.length === 0) {
    // No rates are active yet for this date.
    // As a fallback, we can sort all rates and return the oldest one.
    const sortedHistory = [...allCostHistory].sort(
      (a, b) => new Date(a.effective_date) - new Date(b.effective_date)
    );
    return sortedHistory[0] || null;
  }

  // 2. Sort by effective_date descending to get the *most recent* valid snapshot
  validSnapshots.sort(
    (a, b) => new Date(b.effective_date) - new Date(a.effective_date)
  );

  // 3. The top one is the correct settings object for that date
  return validSnapshots[0];
}
