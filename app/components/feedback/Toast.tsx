import React from 'react';

interface ToastProps {
  msg: string;
  type: "success" | "error";
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 px-4 py-3 rounded-lg shadow-2xl transform transition-all duration-500 flex items-center gap-3 animate-slide-up z-50 ${type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
    <span className="text-xl">{type === "success" ? "✅" : "⚠️"}</span>
    <div><p className="font-bold text-sm">{type === "success" ? "Success" : "Error"}</p><p className="text-xs opacity-90">{msg}</p></div>
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
  </div>
);