import React from 'react';

interface SmartContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContext: string;
  setHtmlContext: (v: string) => void;
  isDarkMode: boolean;
}

export const SmartContextModal: React.FC<SmartContextModalProps> = ({
  isOpen,
  onClose,
  htmlContext,
  setHtmlContext,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  const theme = {
    bg: isDarkMode ? "bg-[#0d1117] border-gray-700 text-white" : "bg-white border-gray-200 text-gray-800",
    header: isDarkMode ? "border-gray-700 bg-[#161b22]" : "border-gray-100 bg-gray-50",
    input: isDarkMode ? "bg-gray-900 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900",
    subtext: isDarkMode ? "text-gray-400" : "text-gray-500",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`w-full max-w-2xl rounded-xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] ${theme.bg}`}>
        
        {/* Header */}
        <div className={`p-4 border-b flex justify-between items-center ${theme.header}`}>
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              Smart Context (HTML)
            </h3>
            <p className={`text-xs mt-1 ${theme.subtext}`}>
              Paste the HTML/DOM structure here. AI will use specific IDs/Classes from this code.
            </p>
          </div>
          <button onClick={onClose} className="text-2xl opacity-50 hover:opacity-100">&times;</button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 flex flex-col">
          <textarea
            value={htmlContext}
            onChange={(e) => setHtmlContext(e.target.value)}
            placeholder='Example: <form id="login-form"><input name="user" ... /></form>'
            className={`w-full flex-1 p-4 rounded border outline-none font-mono text-xs resize-none ${theme.input}`}
            style={{ minHeight: "300px" }}
          />
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex justify-between items-center ${theme.header}`}>
          <button 
            onClick={() => setHtmlContext("")} 
            className="text-xs text-red-500 hover:underline"
          >
            Clear Context
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg transition"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};