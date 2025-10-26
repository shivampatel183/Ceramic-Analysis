import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Plus, Trash2, Loader2, Download } from "lucide-react";

// Helper component for input fields
const InputField = ({ label, value, onChange, type = "number" }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      value={value || 0}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
    />
  </div>
);

// Helper for section headings
const SectionHeader = ({ title }) => (
  <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
    {title}
  </h2>
);

// Define the shape of a new snapshot
const newSnapshotTemplate = {
  effective_date: new Date().toISOString().split("T")[0],
  monthly_salary: 0,
  monthly_maintenance: 0,
  monthly_interest_legal: 0,
  monthly_admin_others: 0,
  electricity_rate_per_unit: 0,
  gas_rate_per_scm: 0,
  coal_rate_per_kg: 0,
  body_cost_per_kg: 0,
  prem_box_rate: 0,
  std_eco_box_rate: 0,
  corner_paper_stapping_rate: 0,
  ink_rate_base: 0,
  ink_rate_brown: 0,
  ink_rate_black: 0,
  ink_rate_blue: 0,
  ink_rate_red: 0,
  ink_rate_yellow: 0,
  ink_rate_green: 0,
  glaze_rate_op: 0,
  glaze_rate_vc: 0,
  glaze_rate_engobe: 0,
};

export default function Fixedcost() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [latestSettings, setLatestSettings] = useState(null);
  const [formState, setFormState] = useState(newSnapshotTemplate);

  // Helper to update individual form fields
  const handleFormChange = (key, value) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Fetch all rate history and the latest rate
  async function fetchData() {
    setLoading(true);

    // Fetch all history sorted by date
    const historyPromise = supabase
      .from("cost_settings_history")
      .select("*")
      .order("effective_date", { ascending: false });

    // Fetch just the most recent snapshot
    const latestPromise = supabase
      .from("cost_settings_history")
      .select("*")
      .order("effective_date", { ascending: false })
      .limit(1)
      .single();

    const [historyResult, latestResult] = await Promise.all([
      historyPromise,
      latestPromise,
    ]);

    if (historyResult.error)
      setMessage("Error fetching history: " + historyResult.error.message);
    else setHistory(historyResult.data || []);

    if (latestResult.data) {
      setLatestSettings(latestResult.data);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Pre-fill the form with the latest settings
  const loadLatestSettings = () => {
    if (latestSettings) {
      // Use latest settings but set a new date
      setFormState({
        ...latestSettings,
        id: null, // Clear ID to ensure it's a new insert
        created_at: null,
        effective_date: new Date().toISOString().split("T")[0],
      });
      setMessage("Loaded latest settings. Set a new effective date and save.");
    } else {
      setMessage("No settings found to load.");
    }
  };

  // Handle adding a new rate snapshot
  const handleSaveSnapshot = async () => {
    setLoading(true);

    const dataToSave = { ...formState };
    // Remove null/undefined fields that DB should default
    delete dataToSave.id;
    delete dataToSave.created_at;

    // Convert all numeric fields
    for (const key in dataToSave) {
      if (key !== "effective_date" && key !== "user_id") {
        dataToSave[key] = Number(dataToSave[key] || 0);
      }
    }

    // Use upsert to insert OR update if a snapshot for that exact date already exists
    const { error } = await supabase
      .from("cost_settings_history")
      .upsert(dataToSave, { onConflict: "user_id, effective_date" });

    if (error) {
      setMessage("Error saving snapshot: " + error.message);
    } else {
      setMessage("Snapshot saved successfully!");
      setFormState(newSnapshotTemplate); // Reset form
      await fetchData(); // Refresh history
    }
    setLoading(false);
  };

  // Handle deleting a snapshot
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this historical snapshot?"
      )
    )
      return;

    setLoading(true);
    const { error } = await supabase
      .from("cost_settings_history")
      .delete()
      .eq("id", id);
    if (error) {
      setMessage("Error deleting: " + error.message);
    } else {
      setMessage("Snapshot deleted.");
      await fetchData();
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-GB");
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-6">
        Cost Settings History
      </h1>

      {/* 1. Add New Snapshot Form */}
      <div className="p-6 bg-white rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Add New Settings Snapshot
          </h2>
          <button
            onClick={loadLatestSettings}
            disabled={!latestSettings || loading}
            className="flex items-center gap-2 py-2 px-4 bg-blue-600 text-white text-sm font-semibold rounded-md shadow hover:bg-blue-700 disabled:opacity-50"
          >
            <Download size={16} />
            Load Latest Settings to Edit
          </button>
        </div>

        {message && (
          <p className="text-sm text-center text-gray-600 my-4">{message}</p>
        )}

        {/* --- Form Section --- */}
        <div className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Effective Date
            </label>
            <input
              type="date"
              value={formState.effective_date}
              onChange={(e) =>
                handleFormChange("effective_date", e.target.value)
              }
              className="mt-1 block w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Monthly Costs */}
          <div>
            <SectionHeader title="Monthly Fixed Costs" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <InputField
                label="Total Salary"
                value={formState.monthly_salary}
                onChange={(v) => handleFormChange("monthly_salary", v)}
              />
              <InputField
                label="Total Maintenance"
                value={formState.monthly_maintenance}
                onChange={(v) => handleFormChange("monthly_maintenance", v)}
              />
              <InputField
                label="Total Interest & Legal"
                value={formState.monthly_interest_legal}
                onChange={(v) => handleFormChange("monthly_interest_legal", v)}
              />
              <InputField
                label="Total Admin & Others"
                value={formState.monthly_admin_others}
                onChange={(v) => handleFormChange("monthly_admin_others", v)}
              />
            </div>
          </div>

          {/* Unit Rates */}
          <div>
            <SectionHeader title="General Unit Rates" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <InputField
                label="Electricity (per Unit)"
                value={formState.electricity_rate_per_unit}
                onChange={(v) =>
                  handleFormChange("electricity_rate_per_unit", v)
                }
              />
              <InputField
                label="Gas (per SCM)"
                value={formState.gas_rate_per_scm}
                onChange={(v) => handleFormChange("gas_rate_per_scm", v)}
              />
              <InputField
                label="Coal (per KG)"
                value={formState.coal_rate_per_kg}
                onChange={(v) => handleFormChange("coal_rate_per_kg", v)}
              />
              <InputField
                label="Body Cost (per KG)"
                value={formState.body_cost_per_kg}
                onChange={(v) => handleFormChange("body_cost_per_kg", v)}
              />
            </div>
          </div>

          {/* Packing Rates */}
          <div>
            <SectionHeader title="Packing Rates" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Premium Box Rate"
                value={formState.prem_box_rate}
                onChange={(v) => handleFormChange("prem_box_rate", v)}
              />
              <InputField
                label="Std/Eco Box Rate"
                value={formState.std_eco_box_rate}
                onChange={(v) => handleFormChange("std_eco_box_rate", v)}
              />
              <InputField
                label="Corner/Paper Rate"
                value={formState.corner_paper_stapping_rate}
                onChange={(v) =>
                  handleFormChange("corner_paper_stapping_rate", v)
                }
              />
            </div>
          </div>

          {/* Ink Rates */}
          <div>
            <SectionHeader title="Ink Rates" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <InputField
                label="Base"
                value={formState.ink_rate_base}
                onChange={(v) => handleFormChange("ink_rate_base", v)}
              />
              <InputField
                label="Brown"
                value={formState.ink_rate_brown}
                onChange={(v) => handleFormChange("ink_rate_brown", v)}
              />
              <InputField
                label="Black"
                value={formState.ink_rate_black}
                onChange={(v) => handleFormChange("ink_rate_black", v)}
              />
              <InputField
                label="Blue"
                value={formState.ink_rate_blue}
                onChange={(v) => handleFormChange("ink_rate_blue", v)}
              />
              <InputField
                label="Red"
                value={formState.ink_rate_red}
                onChange={(v) => handleFormChange("ink_rate_red", v)}
              />
              <InputField
                label="Yellow"
                value={formState.ink_rate_yellow}
                onChange={(v) => handleFormChange("ink_rate_yellow", v)}
              />
              <InputField
                label="Green"
                value={formState.ink_rate_green}
                onChange={(v) => handleFormChange("ink_rate_green", v)}
              />
            </div>
          </div>

          {/* Glaze Rates */}
          <div>
            <SectionHeader title="Glaze Rates" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="OP Rate"
                value={formState.glaze_rate_op}
                onChange={(v) => handleFormChange("glaze_rate_op", v)}
              />
              <InputField
                label="VC Rate"
                value={formState.glaze_rate_vc}
                onChange={(v) => handleFormChange("glaze_rate_vc", v)}
              />
              <InputField
                label="Engobe Rate"
                value={formState.glaze_rate_engobe}
                onChange={(v) => handleFormChange("glaze_rate_engobe", v)}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6">
            <button
              onClick={handleSaveSnapshot}
              disabled={loading}
              className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
            >
              <Plus size={20} className="mr-2" />
              {loading ? "Saving..." : "Save New Snapshot"}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Rate History Table */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Saved Settings History
        </h2>
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="min-w-full w-full divide-y divide-gray-200">
              <thead className="bg-slate-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-semibold text-left text-slate-600">
                    Effective Date
                  </th>
                  <th className="px-4 py-3 font-semibold text-left text-slate-600">
                    Salary
                  </th>
                  <th className="px-4 py-3 font-semibold text-left text-slate-600">
                    Electricity
                  </th>
                  <th className="px-4 py-3 font-semibold text-left text-slate-600">
                    Gas
                  </th>
                  <th className="px-4 py-3 font-semibold text-right text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {history.map((snapshot) => (
                  <tr key={snapshot.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {formatDate(snapshot.effective_date)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {snapshot.monthly_salary}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {snapshot.electricity_rate_per_unit}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {snapshot.gas_rate_per_scm}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(snapshot.id)}
                        className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
