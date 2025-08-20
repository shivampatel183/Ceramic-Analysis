import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Sheet() {
  const [formData, setFormData] = useState({
    // 📦 Production sections
    size: "",
    green_box_weight: "",
    press_box: "",
    before_flow: "",
    kiln_entry_box: "",
    packing_box: "",
    fired_loss_box: "",
    spray_dryer_production: "",
    coal_units_use: "",
    gas_consumption: "",

    // 🏭 Boxes
    pre_box: "",
    std_box: "",
    eco_box: "",

    // 🎨 Colors
    base: "",
    brown: "",
    black: "",
    blue: "",
    red: "",
    yellow: "",
    green: "",

    // ⚙️ Others
    maintenance: "",
    legal_illegal: "",
    office: "",
    diesel: "",
    general_freight: "",
    kiln_gap: "",
    commutative_kiln_gap: "",
    daily_unsizing_stock: "",
    body_cost: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please log in first.");
        return;
      }

      // Convert numeric fields (everything except size)
      const numericFields = Object.keys(formData).filter((k) => k !== "size");
      const cleanedData = { ...formData };
      numericFields.forEach((f) => {
        cleanedData[f] = cleanedData[f] !== "" ? Number(cleanedData[f]) : null;
      });

      const { data, error } = await supabase
        .from("production_data")
        .insert([{ ...cleanedData, user_id: user.id }]);

      if (error) {
        console.error("❌ Insert error:", error.message);
        alert("Insert failed: " + error.message);
      } else {
        console.log("✅ Insert success:", data);
        alert("Data inserted successfully!");
        setFormData(
          Object.fromEntries(Object.keys(formData).map((k) => [k, ""]))
        );
      }
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      alert("Unexpected error: " + err.message);
    }
  };

  // ✅ Group fields by category
  const categories = {
    "📦 Production": [
      "size",
      "green_box_weight",
      "press_box",
      "before_flow",
      "kiln_entry_box",
      "packing_box",
      "fired_loss_box",
      "spray_dryer_production",
      "coal_units_use",
      "gas_consumption",
    ],
    "🏭 Boxes": ["pre_box", "std_box", "eco_box"],
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

  return (
    <div className="max-w-6xl mx-auto p-8 bg-white shadow-lg rounded-xl mt-8">
      <h2 className="text-2xl font-bold text-center mb-6 text-indigo-600">
        Production Data Entry
      </h2>

      <form onSubmit={handleSubmit} className="space-y-10">
        {Object.entries(categories).map(([category, fields]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold text-indigo-700 border-b pb-2 mb-4">
              {category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {fields.map((key) => (
                <div key={key} className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-1">
                    {key.replace(/_/g, " ")}
                  </label>
                  <input
                    type="text"
                    name={key}
                    value={formData[key]}
                    onChange={handleChange}
                    placeholder={`Enter ${key.replace(/_/g, " ")}`}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-center mt-6">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-md transition"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
