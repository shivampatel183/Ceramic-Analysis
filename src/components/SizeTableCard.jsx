// components/SizeTableCard.jsx
import { Card, CardHeader, CardTitle, CardContent } from "./Card";

export default function SizeTableCard({ title, data, columns }) {
  return (
    <Card className="shadow-md rounded-xl border-0 bg-white">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600">
              {columns.map((col, idx) => (
                <th key={idx} className={`p-2 ${col.align || "text-left"}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(data || {}).length > 0 ? (
              Object.entries(data).map(([size, value], idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50 transition">
                  <td className="p-2">{size}</td>
                  {Array.isArray(value) ? (
                    value.map((v, i) => (
                      <td key={i} className="p-2 text-right">
                        {v.toFixed(2)}
                      </td>
                    ))
                  ) : typeof value === "object" ? (
                    Object.values(value).map((v, i) => (
                      <td key={i} className="p-2 text-right">
                        {v.toFixed(2)}
                      </td>
                    ))
                  ) : (
                    <td className="p-2 text-right">{value.toFixed(2)}</td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-2 text-center text-gray-400"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
