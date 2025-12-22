import React, { useState, useRef, useEffect, useMemo } from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism.css";
import { getTheme } from "../../utils/theme";
import { ResultData, GeneratedFile, LintItem } from "../../types";
import { RefineInput } from "./RefineInput";
import { ExplanationModal } from "../modals/ExplanationModal";

interface WorkspaceProps {
  isDarkMode: boolean;
  resultData: ResultData;
  activeFile: GeneratedFile | null;
  setActiveFile: (file: GeneratedFile) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  updateActiveFileContent: (code: string) => void;
  validLintItems: LintItem[];
  handleFixCode: (item: LintItem) => void;
  fixingId: number | null;
  handleDownloadZip: () => void;
  showToast: (msg: string) => void;

  handleRefineCode: (instruction: string) => void;
  isRefining: boolean;

  explanationData: { show: boolean; content: string; isLoading: boolean };
  handleExplainCode: (snippet: string) => void;
  closeExplanation: () => void;
}

export const Workspace: React.FC<WorkspaceProps> = (props) => {
  const {
    isDarkMode,
    resultData,
    activeFile,
    setActiveFile,
    activeTab,
    setActiveTab,
    updateActiveFileContent,
    validLintItems,
    handleFixCode,
    fixingId,
    handleDownloadZip,
    showToast,
    handleRefineCode,
    isRefining,
    explanationData,
    handleExplainCode,
    closeExplanation,
  } = props;

  const theme = getTheme(isDarkMode);

  const [copySuccess, setCopySuccess] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  const [selectedText, setSelectedText] = useState("");
  const [showExplainBtn, setShowExplainBtn] = useState(false);
  const [btnPos, setBtnPos] = useState({ top: 0, left: 0 });

  const [sessionOriginal, setSessionOriginal] = useState<string>("");

  useEffect(() => {
    if (activeFile) {
      setSessionOriginal(activeFile.content);
    }
  }, [activeFile?.path]);

  const isModified = useMemo(() => {
    if (!activeFile) return false;

    if (activeFile.originalContent) {
      return activeFile.content !== activeFile.originalContent;
    }

    return activeFile.content !== sessionOriginal;
  }, [activeFile, sessionOriginal]);

  const handleResetFile = () => {
    if (!activeFile) return;

    const original = activeFile.originalContent || sessionOriginal;
    updateActiveFileContent(original);
    showToast("Code reverted to original version!");
  };

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(event.target as Node)
      ) {
        setShowDownloadMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMouseUp = (e: React.MouseEvent) => {
    const target = e.target as HTMLTextAreaElement;
    let text = "";

    if (target.tagName === "TEXTAREA") {
      const start = target.selectionStart;
      const end = target.selectionEnd;
      if (start !== end) {
        text = target.value.substring(start, end);
      }
    } else {
      const selection = window.getSelection();
      if (selection) text = selection.toString();
    }

    if (text && text.trim().length >= 2) {
      setBtnPos({
        top: e.clientY - 55,
        left: e.clientX,
      });

      setSelectedText(text);
      setShowExplainBtn(true);
    } else {
      setShowExplainBtn(false);
    }
  };

  const onExplainClick = () => {
    handleExplainCode(selectedText);
    setShowExplainBtn(false);
    window.getSelection()?.removeAllRanges();
  };

  const handleCopyCode = async () => {
    if (!activeFile?.content) return;
    await navigator.clipboard.writeText(activeFile.content);
    setCopySuccess(true);
    showToast("Kode berhasil disalin! 📋");
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!activeFile) return;
    const element = document.createElement("a");
    const file = new Blob([activeFile.content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = activeFile.path.split("/").pop() || "file";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast("File downloaded! 📥");
    setShowDownloadMenu(false);
  };

  const renderBreadcrumbs = (path: string) => {
    if (!path) return null;
    const parts = path.split("/");
    const fileName = parts.pop();

    const parentFolder = parts.length > 0 ? parts[parts.length - 1] : null;

    return (
      <div className="flex items-center gap-1 text-xs font-mono overflow-hidden whitespace-nowrap min-w-0">
        {parentFolder && (
          <div className="flex items-center flex-shrink-0 text-gray-500 dark:text-gray-400 hidden sm:flex">
            <span className="mr-0.5 opacity-70">📂</span>
            <span className="max-w-[80px] truncate">{parentFolder}</span>
            <span className="mx-1 opacity-40">›</span>
          </div>
        )}
        <div className="flex items-center font-bold text-blue-600 dark:text-blue-400 min-w-0 flex-1">
          <span className="mr-1 flex-shrink-0">📄</span>
          <span className="truncate" title={fileName}>
            {fileName}
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className={`flex flex-col h-full border rounded-lg overflow-hidden shadow-2xl ${
          isDarkMode ? "border-gray-700" : "border-gray-300"
        }`}
      >
        {/* HEADER */}
        <div
          className={`flex items-center border-b px-2 ${theme.editorHeader}`}
        >
          <button
            onClick={() => setActiveTab("code")}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "code"
                ? "border-blue-500 text-blue-500 bg-blue-500/10"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>💻 Code Editor</span>
          </button>
          <button
            onClick={() => setActiveTab("lint")}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "lint"
                ? "border-purple-500 text-purple-500 bg-purple-500/10"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>🛡️ Quality Check</span>
            {validLintItems.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {validLintItems.length}
              </span>
            )}
          </button>

          {activeTab === "code" && activeFile && (
            <div className="ml-4 hidden md:flex items-center flex-1 min-w-0 overflow-hidden">
              {renderBreadcrumbs(activeFile.path)}
            </div>
          )}

          {activeTab === "code" && (
            <div className="flex gap-2 py-1 ml-2 items-center">
              {isModified && (
                <button
                  onClick={handleResetFile}
                  className="flex items-center justify-center w-8 h-8 rounded transition-all duration-200 border border-transparent text-gray-400 hover:text-red-600 hover:bg-red-50 dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-900/30"
                  title="Reset to Original AI Code"
                >
                  <span className="text-sm font-bold">↺</span>
                </button>
              )}

              <button
                onClick={handleCopyCode}
                className={`flex items-center gap-1 px-3 py-1.5 rounded transition-all duration-200 border border-transparent ${
                  copySuccess
                    ? "text-green-500 bg-green-500/10"
                    : "hover:text-green-500 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {copySuccess ? (
                  <span className="text-sm">✅</span>
                ) : (
                  <span className="text-sm">📋</span>
                )}
              </button>

              <div className="relative" ref={downloadMenuRef}>
                <button
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded transition-all duration-200 border ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-300"
                      : "border-gray-300 bg-white hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  <span className="text-sm">💾</span>
                  <span className="text-xs font-bold">Download</span>
                  <span className="text-[10px] ml-1 opacity-70">▼</span>
                </button>
                {showDownloadMenu && (
                  <div
                    className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-xl border z-50 overflow-hidden animate-fade-in ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <button
                      onClick={handleDownloadFile}
                      className={`w-full text-left px-4 py-3 text-xs flex items-center gap-2 transition-colors ${
                        isDarkMode
                          ? "hover:bg-gray-700 text-gray-300"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <span className="text-lg">📄</span>
                      <div>
                        <span className="font-bold block">Current File</span>
                        <span className="opacity-60 text-[10px]">
                          Just this file
                        </span>
                      </div>
                    </button>
                    <div
                      className={`border-t ${
                        isDarkMode ? "border-gray-700" : "border-gray-100"
                      }`}
                    ></div>
                    <button
                      onClick={() => {
                        handleDownloadZip();
                        setShowDownloadMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-xs flex items-center gap-2 transition-colors ${
                        isDarkMode
                          ? "hover:bg-gray-700 text-blue-400"
                          : "hover:bg-blue-50 text-blue-600"
                      }`}
                    >
                      <span className="text-lg">📦</span>
                      <div>
                        <span className="font-bold block">
                          Download Project
                        </span>
                        <span className="opacity-60 text-[10px]">
                          All files as .zip
                        </span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {activeTab === "code" && (
            <div
              className={`w-1/4 min-w-[200px] border-r flex flex-col ${
                theme.fileListBg
              } ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}
            >
              <div
                className={`p-3 text-xs font-bold uppercase tracking-wider ${
                  isDarkMode
                    ? "text-gray-300 bg-gray-700"
                    : "text-gray-600 bg-gray-200"
                }`}
              >
                Project Files
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                {resultData.generated_files.map((file, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveFile(file)}
                    className={`w-full text-left px-3 py-2 rounded text-xs truncate transition ${
                      activeFile?.path === file.path
                        ? theme.fileActive
                        : `${theme.text} ${theme.fileListHover}`
                    }`}
                  >
                    <div className="truncate w-full">
                      <span className="mr-2 opacity-70">📄</span>
                      {file.path.split("/").pop()}
                    </div>
                    {file.originalContent &&
                      file.content !== file.originalContent && (
                        <span className="text-[10px] text-yellow-500 ml-auto font-bold absolute right-2 top-3">
                          ●
                        </span>
                      )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            className={`flex-1 flex flex-col ${
              activeTab === "code" ? "w-3/4" : "w-full"
            } ${isDarkMode ? "bg-[#0d1117]" : "bg-white"}`}
          >
            {activeTab === "code" ? (
              <div className="flex flex-col h-full">
                <div
                  className={`flex-1 overflow-auto relative group custom-scrollbar ${
                    isDarkMode ? "bg-[#1e1e1e]" : "bg-white"
                  }`}
                  onMouseUp={handleMouseUp}
                >
                  <Editor
                    value={activeFile?.content || ""}
                    onValueChange={updateActiveFileContent}
                    highlight={(code) =>
                      highlight(code, languages.js, "javascript")
                    }
                    padding={15}
                    className="font-mono text-xs min-h-full"
                    style={{
                      fontFamily: '"Fira Code", "Fira Mono", monospace',
                      fontSize: 12,
                      backgroundColor: "transparent",
                      color: isDarkMode ? "#f8f8f2" : "#333",
                    }}
                  />
                </div>
                {/* INTERACTIVE REFINEMENT INPUT */}
                <div
                  className={`p-4 border-t ${
                    isDarkMode
                      ? "border-gray-700 bg-[#0d1117]"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <RefineInput
                    onRefine={handleRefineCode}
                    isLoading={isRefining}
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto custom-scrollbar">
                {validLintItems.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead
                      className={`text-xs sticky top-0 ${theme.tableHeader}`}
                    >
                      <tr>
                        <th className="p-2 pl-4 w-[10%]">Sev</th>
                        <th className="p-2 w-[20%]">File</th>
                        <th className="p-2 w-[55%]">Message</th>
                        <th className="p-2 text-right w-[15%]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validLintItems.map((lint) => {
                        const targetFile = resultData.generated_files.find(
                          (f) => f.path.includes(lint.file)
                        );
                        return (
                          <tr
                            key={lint.id}
                            className={`border-b ${theme.tableRow}`}
                          >
                            <td className="p-2 pl-4 whitespace-nowrap">
                              {lint.severity === "Error"
                                ? "⛔"
                                : lint.severity === "Warning"
                                ? "⚠️"
                                : "✅"}{" "}
                              {lint.severity}
                            </td>
                            <td className="p-2 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  if (targetFile) {
                                    setActiveFile(targetFile);
                                    setActiveTab("code");
                                  }
                                }}
                                className="font-bold text-blue-500 hover:text-blue-400 hover:underline text-left transition-colors truncate max-w-[150px] block"
                                title={`Go to ${lint.file}`}
                              >
                                {lint.file.split("/").pop()}
                              </button>
                            </td>
                            <td className={`p-2 ${theme.text} break-words`}>
                              {lint.message}
                            </td>
                            <td className="p-2 text-right">
                              {lint.severity !== "Good" && (
                                <button
                                  onClick={() => handleFixCode(lint)}
                                  disabled={fixingId === lint.id}
                                  className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 ml-auto ${
                                    fixingId === lint.id
                                      ? "bg-gray-500 cursor-not-allowed"
                                      : "bg-purple-600 hover:bg-purple-500 text-white"
                                  }`}
                                >
                                  {fixingId === lint.id
                                    ? "Fixing..."
                                    : "Auto Fix"}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2 animate-fade-in">
                    <p className="font-bold">Code is Clean!</p>
                    <p className="text-xs opacity-70 max-w-xs text-center">
                      No issues found. AI analysis passed successfully.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FLOATING EXPLAIN BUTTON */}
      {showExplainBtn && activeTab === "code" && (
        <div
          style={{
            top: btnPos.top,
            left: btnPos.left,
            transform: "translateX(-50%)",
          }}
          className="fixed z-[9999] flex flex-col items-center animate-in fade-in zoom-in duration-200"
        >
          <button
            onClick={onExplainClick}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full shadow-2xl border backdrop-blur-md transition-all active:scale-95 group
              ${
                isDarkMode
                  ? "bg-[#1e1e1e] text-gray-200 border-gray-600 shadow-black/50 hover:bg-[#2d2d2d] hover:text-white"
                  : "bg-white text-gray-700 border-gray-200 shadow-xl hover:bg-gray-50 hover:text-black"
              }
            `}
          >
            <span className="text-base bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent font-bold transition-transform group-hover:rotate-12">
              ✨
            </span>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[11px] font-bold font-sans tracking-wide">
                Explain Code
              </span>
            </div>
          </button>
          <div
            className={`
              w-3 h-3 rotate-45 mt-[-6px] border-r border-b z-[-1]
              ${
                isDarkMode
                  ? "bg-[#1e1e1e] border-gray-600"
                  : "bg-white border-gray-200"
              }
            `}
          ></div>
        </div>
      )}

      {/* EXPLANATION MODAL */}
      <ExplanationModal
        isOpen={explanationData.show}
        isLoading={explanationData.isLoading}
        content={explanationData.content}
        onClose={closeExplanation}
        isDarkMode={isDarkMode}
      />
    </>
  );
};
