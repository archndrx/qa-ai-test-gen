import React, { useState, useEffect, useRef } from "react";
import { getTheme } from "../../utils/theme";

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onAnalyze: (errorLog: string) => void;
  isLoading: boolean;
}

export const DebugModal: React.FC<DebugModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onAnalyze,
  isLoading,
}) => {
  const [errorLog, setErrorLog] = useState("");
  const theme = getTheme(isDarkMode);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!isLoading && errorLog.trim()) {
        onAnalyze(errorLog);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div
        className={`w-full max-w-3xl rounded-xl shadow-2xl border flex flex-col overflow-hidden ${
          isDarkMode
            ? "bg-[#0d1117] border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        {/* HEADER */}
        <div
          className={`p-4 border-b flex justify-between items-center ${theme.editorHeader}`}
        >
          <div className="flex items-center gap-3">
            <div>
              <h3
                className={`font-bold text-lg ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                AI Debugger
              </h3>
              <p className={`text-xs ${theme.subtext}`}>
                Analyze error logs and auto-fix your test scripts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-2xl opacity-50 hover:opacity-100 hover:text-red-500 transition"
          >
            &times;
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 flex flex-col gap-4">
          {/* Info Banner */}
          <div
            className={`p-3 rounded-lg text-xs border flex gap-3 items-start ${
              isDarkMode
                ? "bg-blue-900/10 border-blue-900/30 text-blue-300"
                : "bg-blue-50 border-blue-100 text-blue-700"
            }`}
          >
            <span className="text-lg">💡</span>
            <div className="leading-relaxed opacity-90">
              <strong>How it works:</strong> Paste the stack trace or error
              message from your terminal (Cypress/Playwright) below. The AI will
              cross-reference it with your active code to find the solution.
            </div>
          </div>

          {/* Input Area */}
          <div className="flex-1 flex flex-col">
            <label
              className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${theme.subtext}`}
            >
              Error Log / Stack Trace
            </label>
            <textarea
              ref={textareaRef}
              value={errorLog}
              onChange={(e) => setErrorLog(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Example:\nAssertionError: Timed out retrying after 4000ms: Expected to find element: \`[data-testid='submit']\`, but never found it.`}
              className={`w-full h-60 p-4 rounded border font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all ${theme.input}`}
            />

            <div className={`text-[10px] text-right mt-1 ${theme.subtext}`}>
              <kbd className="font-bold">Ctrl</kbd> +{" "}
              <kbd className="font-bold">Enter</kbd> to fix
            </div>
          </div>

          {/* Footer Actions */}
          <div
            className={`pt-4 border-t mt-2 flex justify-end gap-3 ${
              isDarkMode ? "border-gray-800" : "border-gray-100"
            }`}
          >
            <button
              onClick={onClose}
              className={`px-5 py-2.5 rounded font-medium text-xs transition-colors ${
                isDarkMode
                  ? "hover:bg-gray-800 text-gray-400"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={() => onAnalyze(errorLog)}
              disabled={isLoading || !errorLog.trim()}
              className={`px-6 py-2.5 rounded font-bold text-xs text-white shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
                isLoading
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-500"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Analyzing...
                </>
              ) : (
                <>Fix Code</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
