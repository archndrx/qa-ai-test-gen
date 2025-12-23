import React, { useState, useEffect } from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-clike"; // Fallback
import { saveAs } from "file-saver";
import { getTheme } from "../../utils/theme";

interface FixtureModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onGenerate: (req: string, fmt: string) => void;
  isLoading: boolean;
  result: string;
  onSaveToWorkspace: (content: string, format: string) => void;
}

export const FixtureModal: React.FC<FixtureModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onGenerate,
  isLoading,
  result,
  onSaveToWorkspace,
}) => {
  const [prompt, setPrompt] = useState("");
  const [format, setFormat] = useState("json");

  const theme = getTheme(isDarkMode);

  const actionBtnClass = `
    flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all
    border border-transparent
    ${
      isDarkMode
        ? "text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/20"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200"
    }
  `;

  //   useEffect(() => {
  //     if (isOpen) {
  //       // Optional: Reset prompt if needed
  //     }
  //   }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
  };

  const handleDownload = () => {
    if (!result) return;
    const extension =
      format === "sql" ? "sql" : format === "csv" ? "csv" : "json";
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `mock_data.${extension}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!isLoading && prompt.trim()) {
        onGenerate(prompt, format);
      }
    }
  };

  const handleFormatChange = (newFormat: string) => {
    setFormat(newFormat);
    if (result && prompt.trim() && !isLoading) {
      onGenerate(prompt, newFormat);
    }
  };

  const highlightCode = (code: string) => {
    if (format === "json")
      return highlight(code, languages.json || languages.clike, "json");
    if (format === "sql")
      return highlight(code, languages.sql || languages.clike, "sql");
    return highlight(code, languages.clike, "clike");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div
        className={`w-full max-w-5xl rounded-xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
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
                Smart Fixture Generator
              </h3>
              <p className={`text-xs ${theme.subtext}`}>
                Generate mock data for testing (JSON, SQL, CSV)
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
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div
            className={`w-full md:w-[35%] p-5 border-r flex flex-col gap-5 ${
              theme.fileListBg
            } ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}
          >
            <div>
              <label
                className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${theme.subtext}`}
              >
                Output Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["json", "sql", "csv"].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleFormatChange(fmt)}
                    disabled={isLoading}
                    className={`py-2 px-3 rounded text-xs font-bold uppercase border transition-all ${
                      format === fmt
                        ? isDarkMode
                          ? "bg-purple-900/30 border-purple-500 text-purple-400"
                          : "bg-purple-50 border-purple-500 text-purple-700"
                        : theme.input
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Description Input */}
            <div className="flex-1 flex flex-col">
              <label
                className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${theme.subtext}`}
              >
                Data Description
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Example: Generate 5 users with Indonesian names, realistic emails, random roles (admin/staff), and active status..."
                className={`w-full flex-1 p-3 rounded border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all ${theme.input} font-sans`}
              />
              <div className={`text-[10px] text-right mt-1 ${theme.subtext}`}>
                <kbd className="font-bold">Ctrl</kbd> +{" "}
                <kbd className="font-bold">Enter</kbd> to generate
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={() => onGenerate(prompt, format)}
              disabled={isLoading || !prompt.trim()}
              className={`w-full py-3 rounded font-bold text-white shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2 ${
                isLoading
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-500"
              }`}
            >
              {isLoading ? (
                <>
                  Processing <span className="animate-pulse">...</span>
                </>
              ) : (
                <>Generate Data</>
              )}
            </button>
          </div>

          <div
            className={`w-full md:w-[65%] flex flex-col relative ${
              isDarkMode ? "bg-[#0d1117]" : "bg-white"
            }`}
          >
            {/* Toolbar Output */}
            <div
              className={`flex justify-between items-center px-4 py-2 border-b h-12 shrink-0 ${theme.editorHeader}`}
            >
              <div className="flex items-center gap-2">
                {/* Dot Indicator */}
                <div
                  className={`w-2 h-2 rounded-full ${
                    result ? "bg-green-500" : "bg-gray-300"
                  }`}
                ></div>
                <span className="text-xs font-mono opacity-60">
                  output.{format}
                </span>
              </div>

              <div className="flex gap-1">
                {result && (
                  <>
                    <button
                      onClick={() => onSaveToWorkspace(result, format)}
                      className={actionBtnClass}
                      title="Save to project"
                    >
                      <span className="text-sm">📂</span> Save
                    </button>

                    <button
                      onClick={handleCopy}
                      className={actionBtnClass}
                      title="Copy to clipboard"
                    >
                      <span className="text-sm">📋</span> Copy
                    </button>

                    <button
                      onClick={handleDownload}
                      className={actionBtnClass}
                      title="Download file"
                    >
                      <span className="text-sm">💾</span> Download
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-auto custom-scrollbar p-0 relative group flex flex-col min-h-[300px]">
              {isLoading ? (
                <div
                  className={`absolute inset-0 z-20 flex flex-col items-center justify-center animate-in fade-in duration-200 ${
                    isDarkMode ? "bg-[#0d1117]" : "bg-white"
                  }`}
                >
                  <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p
                    className={`font-bold text-sm ${
                      isDarkMode ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    Generating {format.toUpperCase()}...
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      isDarkMode ? "text-gray-500" : "text-gray-500"
                    }`}
                  >
                    AI is cooking your data
                  </p>
                </div>
              ) : null}

              {result ? (
                <Editor
                  value={result}
                  onValueChange={() => {}}
                  highlight={highlightCode}
                  padding={20}
                  className="font-mono text-xs min-h-full"
                  style={{
                    fontFamily: '"Fira Code", "Fira Mono", monospace',
                    fontSize: 12,
                    backgroundColor: "transparent",
                    color: isDarkMode ? "#f8f8f2" : "#333",
                  }}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-300">
                  <div
                    className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-sm ${
                      isDarkMode
                        ? "bg-gray-800/50"
                        : "bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <span className="text-5xl opacity-80 filter drop-shadow-md">
                      🎲
                    </span>
                  </div>

                  <h4
                    className={`font-bold text-lg mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Ready to Generate
                  </h4>
                  <p
                    className={`text-xs max-w-xs leading-relaxed ${theme.subtext}`}
                  >
                    Select your preferred format (JSON/SQL) and describe the
                    data you need on the left panel.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
