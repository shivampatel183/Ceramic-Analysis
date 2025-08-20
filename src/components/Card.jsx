// src/components/Card.jsx
export function Card({ children, className }) {
  return (
    <div className={`bg-white shadow rounded-lg p-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children }) {
  return <div className="mb-2 font-bold text-lg">{children}</div>;
}

export function CardContent({ children }) {
  return <div>{children}</div>;
}

export function CardTitle({ children }) {
  return <h2 className="text-xl font-semibold">{children}</h2>;
}
