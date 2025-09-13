// components/StatCard.jsx
import { Card, CardHeader, CardTitle, CardContent } from "./Card";

export default function StatCard({
  title,
  label,
  value,
  unit = "",
  extra = null,
}) {
  return (
    <Card className="shadow-md rounded-xl border-0 bg-white">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-3">
          <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-lg font-bold text-indigo-600">
              {unit} {value ? value.toFixed(2) : "0.00"}
            </p>
          </div>
          {extra}
        </div>
      </CardContent>
    </Card>
  );
}
