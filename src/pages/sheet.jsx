import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { PlusCircle, Loader2 } from "lucide-react";
import Toast from "../components/Toast.jsx"; // Import the new Toast component

const departmentCategories = {
  Production: ["📦 Production"],
  Packaging: ["🏭 Boxes"],
  "Die(Color)": ["🎨 Colors (Die)"],
  Other: ["⚙️ Others"],
  All: ["📦 Production", "🏭 Boxes", "🎨 Colors (Die)", "⚙️ Others"],
};

const allCategories = {
  "📦 Production": [
    "date",
    "size",
    "green_box_weight",
    "press_box",
    "before_flow",
    "kiln_entry_box",
    "fired_loss_box",
    "sizing_fire_loss_boxes",
    "spray_dryer_production",
    "coal_units_use",
    "daily_electricity_units_use",
    "gas_consumption",
  ],
  "🏭 Boxes": ["packing_box", "pre_box", "std_box", "eco_box"],
  "🎨 Colors (Die)": [
    "base",
    "brown",
    "black",
    "blue",
    "red",
    "yellow",
    "green",
  ],
  "⚙️ Others": [
    "maintenance",
    "legal_illegal",
    "office",
    "diesel",
    "general_freight",
    "kiln_gap",
    "commutative_kiln_gap",
    "daily_unsizing_stock",
    "body_cost",
  ],
};

const sizeOptions = ["600x600", "200x1000", "150x900", "200x1200", "400x400"];

const initialFormData = {
  date: new Date().toISOString().split("T")[0],
  size: "",
  green_box_weight: "",
  press_box: "",
  before_flow: "",
  kiln_entry_box: "",
  packing_box: "",
  fired_loss_box: "",
  sizing_fire_loss_boxes: "",
  spray_dryer_production: "",
  coal_units_use: "",
  daily_electricity_units_use: "",
  gas_consumption: "",
  pre_box: "",
  std_box: "",
  eco_box: "",
  base: "",
  brown: "",
  black: "",
  blue: "",
  red: "",
  yellow: "",
  green: "",
  maintenance: "",
  legal_illegal: "",
  office: "",
  diesel: "",
  general_freight: "",
  kiln_gap: "",
  commutative_kiln_gap: "",
  daily_unsizing_stock: "",
  body_cost: "",
};

export default function Sheet({ userDepartment }) {
  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (!formData.size) {
      setNotification({
        type: "error",
        message: "Please select a size before submitting.",
      });
      return;
    }

    setIsLoading(true);
    setNotification(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to submit data.");

      const numericFields = Object.keys(formData).filter(
        (k) => k !== "size" && k !== "date"
      );
      const cleanedData = { ...formData };
      numericFields.forEach((f) => {
        cleanedData[f] = cleanedData[f] !== "" ? Number(cleanedData[f]) : null;
      });

      const { error } = await supabase
        .from("production_data")
        .insert([{ ...cleanedData, user_id: user.id }]);

      if (error) throw error;

      localStorage.setItem("refreshData", "true");
      setNotification({
        type: "success",
        message: "Data inserted successfully!",
      });
      setFormData(initialFormData); // Reset form to initial state
    } catch (err) {
      console.error("❌ Submission error:", err);
      setNotification({
        type: "error",
        message: `Submission failed: ${err.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const visibleCategories = departmentCategories[userDepartment] || [];

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(null)}
        />
      )}

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-gray-800">
            Production Data Entry
          </h1>
          <p className="text-gray-500 mt-2">
            Fill in the details for the categories visible to you.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-lg rounded-xl p-6 sm:p-8 space-y-10"
        >
          {Object.entries(allCategories)
            .filter(([category]) => visibleCategories.includes(category))
            .map(([category, fields]) => (
              <div key={category}>
                <h3 className="text-xl font-semibold text-indigo-700 border-b-2 border-indigo-100 pb-3 mb-6">
                  {category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fields.map((key) => (
                    <div key={key} className="flex flex-col">
                      <label className="text-sm font-semibold text-gray-600 mb-2 capitalize">
                        {key.replace(/_/g, " ")}
                      </label>
                      {key === "size" ? (
                        <select
                          name={key}
                          value={formData[key]}
                          onChange={handleChange}
                          required
                          className="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                        >
                          <option value="">Select Size</option>
                          {sizeOptions.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      ) : key === "date" ? (
                        <input
                          type="date"
                          name={key}
                          value={formData[key]}
                          onChange={handleChange}
                          required
                          className="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                        />
                      ) : (
                        <input
                          type="number"
                          step="any"
                          name={key}
                          value={formData[key]}
                          onChange={handleChange}
                          placeholder={`Enter value`}
                          className="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition p-1.5"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

          <div className="flex justify-center pt-6 border-t mt-10">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg shadow-md transition-all duration-300 font-semibold disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Submitting...
                </>
              ) : (
                <>
                  <PlusCircle size={20} /> Submit Data
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
