// src/components/Dialog.jsx
import { useState } from "react";

export function Dialog({ children, trigger }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>{trigger}</button>
      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            {children}
            <button
              onClick={() => setOpen(false)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function DialogHeader({ children }) {
  return <div className="mb-2 font-bold text-lg">{children}</div>;
}

export function DialogTitle({ children }) {
  return <h2 className="text-xl font-semibold">{children}</h2>;
}

export function DialogContent({ children }) {
  return <div>{children}</div>;
}

export function DialogTrigger({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      {children}
    </button>
  );
}
