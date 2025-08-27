import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";

export function calculateNetProduction({ netProduction, sizeData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="shadow-md rounded-xl border-0 bg-white">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">
            Net Production
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-indigo-600">
            {netProduction.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Units</p>
        </CardContent>
      </Card>

      <Card className="shadow-md rounded-xl border-0 bg-white">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">
            Production by Size
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="p-2 text-left">Size</th>
                <th className="p-2 text-right">Total Production</th>
              </tr>
            </thead>
            <tbody>
              {sizeData.length > 0 ? (
                sizeData.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="p-2">{row.size}</td>
                    <td className="p-2 text-right">{row.total}</td>
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
