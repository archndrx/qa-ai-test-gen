import React from "react";

interface ExplanationModalProps {
  isOpen: boolean;
  isLoading: boolean;
  content: string;
  onClose: () => void;
  isDarkMode: boolean;
}

export const ExplanationModal: React.FC<ExplanationModalProps> = ({
  isOpen,
  isLoading,
  content,
  onClose,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  const theme = {
    bg: isDarkMode
      ? "bg-gray-800 border-gray-700 text-gray-200"
      : "bg-white border-gray-200 text-gray-800",
    header: isDarkMode
      ? "bg-indigo-900/30 border-indigo-800 text-indigo-300"
      : "bg-indigo-50 border-indigo-100 text-indigo-700",
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div
        className={`w-full max-w-2xl rounded-xl shadow-2xl border overflow-hidden flex flex-col max-h-[80vh] ${theme.bg}`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex justify-between items-center ${theme.header}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            <h3 className="font-bold">Code Explanation</h3>
          </div>
          <button
            onClick={onClose}
            className="opacity-50 hover:opacity-100 text-xl"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar leading-relaxed">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3 opacity-70">
              <div className="animate-spin text-3xl">🤔</div>
              <p className="text-sm font-medium animate-pulse">
                Analyzing code logic...
              </p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap font-sans">{content}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
