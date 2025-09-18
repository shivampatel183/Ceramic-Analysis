import React, { useState, useEffect } from "react";

const SIZES = ["600x600", "200x1000", "150x900", "200x1200", "400x400"];

const NUMERIC_FIELDS = [
  "green_box_weight",
  "press_box",
  "before_flow",
  "kiln_entry_box",
  "packing_box",
  "fired_loss_box",
  "sizing_fire_loss_boxes",
  "spray_dryer_production",
  "coal_units_use",
  "daily_electricity_units_use",
  "gas_consumption",
  "pre_box",
  "std_box",
  "eco_box",
  "base",
  "brown",
  "black",
  "blue",
  "red",
  "yellow",
  "green",
  "maintenance",
  "legal_illegal",
  "office",
  "diesel",
  "general_freight",
  "kiln_gap",
  "commutative_kiln_gap",
  "daily_unsizing_stock",
  "body_cost",
];

export default function EditDialog({ open, onClose, row, onSave }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (row) {
      // Format date for display
      const formattedData = { ...row };
      if (formattedData.date) {
        formattedData.date = new Date(formattedData.date)
          .toISOString()
          .split("T")[0];
      }
      setFormData(formattedData);
      setErrors({});
    }
  }, [row]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error for this field

    let processedValue = value;

    if (NUMERIC_FIELDS.includes(name)) {
      if (value === "") {
        processedValue = null;
      } else {
        const num = Number(value);
        if (!isNaN(num)) {
          processedValue = num;
        } else {
          setErrors((prev) => ({
            ...prev,
            [name]: "Please enter a valid number",
          }));
          return;
        }
      }
    }

    // For date field, ensure it's in YYYY-MM-DD format
    if (name === "date" && value) {
      const date = new Date(value);
      if (!isNaN(date)) {
        processedValue = date.toISOString().split("T")[0];
      } else {
        setErrors((prev) => ({
          ...prev,
          date: "Please enter a valid date",
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear all previous errors
    setErrors({});

    // Validate required fields
    const newErrors = {};
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.size) newErrors.size = "Size is required";

    // Validate numeric fields
    NUMERIC_FIELDS.forEach((field) => {
      if (formData[field] !== null && formData[field] !== undefined) {
        const num = Number(formData[field]);
        if (isNaN(num)) {
          newErrors[field] = "Must be a valid number";
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        id: row.id,
        // Ensure numeric fields are properly typed
        ...Object.fromEntries(
          NUMERIC_FIELDS.map((field) => [
            field,
            formData[field] === "" || formData[field] === null
              ? null
              : Number(formData[field]),
          ])
        ),
      };

      await onSave(dataToSave);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // Exclude user_id and id from editable fields
  const editableFields = Object.keys(formData).filter(
    (key) => !["user_id", "id"].includes(key)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Row</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editableFields.map((field) => (
                <div key={field} className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    {field.replace(/_/g, " ")}
                  </label>
                  {field === "size" ? (
                    <select
                      name="size"
                      value={formData.size || ""}
                      onChange={handleChange}
                      className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Size</option>
                      {SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={
                        field === "date"
                          ? "date"
                          : NUMERIC_FIELDS.includes(field)
                          ? "number"
                          : "text"
                      }
                      name={field}
                      value={formData[field] || ""}
                      onChange={handleChange}
                      className={`border ${
                        errors[field] ? "border-red-500" : "border-gray-300"
                      } rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      step={NUMERIC_FIELDS.includes(field) ? "any" : undefined}
                      required={field === "date"}
                    />
                  )}
                  {errors[field] && (
                    <span className="text-red-500 text-xs mt-1">
                      {errors[field]}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
