import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";

export function calculatePowderConsumption({ totalPowder, powderBySize }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-5">
      {/* Total Powder */}
      <Card className="shadow-md rounded-xl border-0 bg-white">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Powder Consumption
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-indigo-600">
            {totalPowder.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Kg (approx.)</p>
        </CardContent>
      </Card>

      {/* Powder by Size */}
      <Card className="shadow-md rounded-xl border-0 bg-white">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">
            Powder Consumption by Size
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="p-2 text-left">Size</th>
                <th className="p-2 text-right">Powder Consumption</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(powderBySize).length > 0 ? (
                Object.entries(powderBySize).map(([size, value], idx) => (
                  <tr
                    key={idx}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="p-2">{size}</td>
                    <td className="p-2 text-right">{value.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="p-2 text-center text-gray-500">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
