// components/FinalResultTable.jsx
import React from "react";

export default function FinalResultTable({ data }) {
  const costHeads = [
    "Body",
    "Glaze",
    "Packing",
    "Fuel",
    "Gas",
    "Electricity",
    "Ink",
    "Salary",
    "Maintenance",
    "Interest, Legal & Unlegal",
    "Admin & Others",
    "Depreciation",
  ];

  // Example sizes
  const sizes = ["150x900", "200x1200", "400x400", "Total"];

  return (
    <div className="bg-white shadow-lg rounded-xl p-4 border border-gray-200 mb-8 overflow-x-auto">
      <h3 className="text-lg font-bold text-indigo-700 mb-4 text-center">
        🏷 Final Cost Summary
      </h3>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-indigo-100 text-indigo-700">
            <th className="border px-3 py-2 text-left">Cost Head</th>
            {sizes.map((size) => (
              <th key={size} className="border px-3 py-2 text-center">
                {size} Cost
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {costHeads.map((head) => (
            <tr key={head} className="hover:bg-gray-50">
              <td className="border px-3 py-2 font-medium">{head}</td>
              {sizes.map((size) => (
                <td
                  key={`${head}-${size}`}
                  className="border px-3 py-2 text-right text-gray-700"
                >
                  {data?.[head]?.[size] ?? "0.00"}
                </td>
              ))}
            </tr>
          ))}

          {/* Total Row */}
          <tr className="bg-yellow-100 font-bold">
            <td className="border px-3 py-2">Total</td>
            {sizes.map((size) => (
              <td
                key={`total-${size}`}
                className="border px-3 py-2 text-right text-indigo-700"
              >
                {data?.Total?.[size] ?? "0.00"}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
