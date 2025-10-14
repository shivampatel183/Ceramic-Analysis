import React, { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

const Toast = ({ message, type, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onDismiss]);

  const isSuccess = type === "success";
  const bgColor = isSuccess ? "bg-green-500" : "bg-red-500";
  const Icon = isSuccess ? CheckCircle : XCircle;

  return (
    <div
      className={`fixed bottom-5 right-5 flex items-center p-4 rounded-lg shadow-xl text-white ${bgColor} animate-fade-in z-50`}
    >
      <Icon className="w-6 h-6 mr-3" />
      <span className="flex-grow">{message}</span>
      <button
        onClick={onDismiss}
        className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Toast;
