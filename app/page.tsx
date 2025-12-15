"use client";
import {
  SetStateAction,
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
  useState,
} from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [framework, setFramework] = useState("cypress");

  const [provider, setProvider] = useState("gemini"); // Default Gemini
  const [userApiKey, setUserApiKey] = useState(""); // Optional BYOK
  // ------------------------------------

  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeFile, setActiveFile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("code");

  const [fixingId, setFixingId] = useState<any>(null);

  // STATE THEME
  const [isDarkMode, setIsDarkMode] = useState(false);

  // --- HANDLERS ---
  const handleGenerate = async () => {
    setLoading(true);
    setResultData(null);
    setActiveFile(null);
    setActiveTab("code");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testCase: input,
          framework: framework,
          provider: provider,
          userApiKey: userApiKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal request ke server");
      }

      if (data.error) {
        alert("Error: " + data.error);
      } else {
        const parsed = JSON.parse(data.result);
        if (parsed.lint_report) {
          parsed.lint_report = parsed.lint_report.map(
            (item: any, idx: any) => ({ ...item, id: idx })
          );
        }
        setResultData(parsed);
        if (parsed.generated_files?.length > 0)
          setActiveFile(parsed.generated_files[0]);
      }
    } catch (err: any) {
      alert(err.message || "Gagal connect server");
    } finally {
      setLoading(false);
    }
  };

  const handleFixCode = async (lintItem: {
    file: any;
    id: any;
    message: any;
  }) => {
    const targetFile = resultData.generated_files.find(
      (f: { path: string | any[] }) => f.path.includes(lintItem.file)
    );

    if (!targetFile) {
      alert(
        "File tidak ditemukan, mungkin nama file di report beda dengan struktur."
      );
      return;
    }

    setFixingId(lintItem.id);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fix",
          currentCode: targetFile.content,
          errorMessage: lintItem.message,
          fileName: targetFile.path,
          provider: provider,
          userApiKey: userApiKey,
        }),
      });

      const data = await res.json();

      if (data.result) {
        const updatedFiles = resultData.generated_files.map(
          (f: { path: any }) =>
            f.path === targetFile.path ? { ...f, content: data.result } : f
        );

        const updatedLint = resultData.lint_report.filter(
          (l: { id: any }) => l.id !== lintItem.id
        );

        setResultData({
          ...resultData,
          generated_files: updatedFiles,
          lint_report: updatedLint,
        });

        if (activeFile && activeFile.path === targetFile.path) {
          setActiveFile({ ...activeFile, content: data.result });
        }
      }
    } catch (e) {
      alert("Gagal memperbaiki kode otomatis.");
    } finally {
      setFixingId(null);
    }
  };

  const downloadFile = () => {
    if (!activeFile) return;
    const element = document.createElement("a");
    const file = new Blob([activeFile.content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    const fileNameOnly = activeFile.path.split("/").pop();
    element.download = fileNameOnly;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // --- THEME UTILS ---
  const theme = {
    bg: isDarkMode ? "bg-gray-900" : "bg-gray-50",
    text: isDarkMode ? "text-white" : "text-gray-800",
    card: isDarkMode
      ? "bg-gray-800 border-gray-700"
      : "bg-white border-gray-200 shadow-lg",
    input: isDarkMode
      ? "bg-gray-900 border-gray-600 focus:border-blue-500 text-white"
      : "bg-white border-gray-300 focus:border-blue-500 text-gray-900",
    label: isDarkMode ? "text-gray-400" : "text-gray-600",
    subtext: isDarkMode ? "text-gray-500" : "text-gray-500",
    fileListBg: isDarkMode ? "bg-gray-800" : "bg-gray-100",
    fileListHover: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200",
    fileActive: isDarkMode
      ? "bg-blue-600 text-white"
      : "bg-blue-600 text-white",
    editorHeader: isDarkMode
      ? "bg-[#161b22] border-gray-700"
      : "bg-gray-200 border-gray-300",
    tableHeader: isDarkMode
      ? "bg-gray-800 text-gray-400"
      : "bg-gray-100 text-gray-600",
    tableRow: isDarkMode
      ? "border-gray-800 hover:bg-gray-800/50"
      : "border-gray-200 hover:bg-gray-50",
  };

  const getPriorityColor = (p: string) => {
    const priority = p ? p.toLowerCase() : "low";
    if (priority === "high") return "bg-red-600 text-white";
    if (priority === "medium") return "bg-yellow-500 text-black";
    return "bg-green-500 text-white";
  };

  return (
    <div
      className={`min-h-screen font-mono text-sm transition-colors duration-300 ${theme.bg} ${theme.text} p-6`}
    >
      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-center text-blue-500">
            QA Copilot{" "}
            <span className="text-xs font-normal text-gray-400 border border-gray-500 rounded px-2 py-0.5 ml-2">
              Beta
            </span>
          </h1>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full transition ${
              isDarkMode ? "bg-yellow-400 text-black" : "bg-gray-800 text-white"
            }`}
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 flex flex-col gap-4 sticky top-6 h-[85vh]">
            <div className={`p-4 rounded border ${theme.card} shrink-0`}>
              <label
                className={`font-bold block mb-3 flex items-center gap-2 ${theme.label}`}
              >
                 AI Settings
              </label>

              <div className="mb-3">
                <span
                  className={`text-[10px] uppercase font-bold mb-1 block ${theme.subtext}`}
                >
                  Select Provider
                </span>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className={`w-full p-2 rounded border outline-none ${theme.input}`}
                >
                  <option value="gemini">Google Gemini (Flash 2.5)</option>
                  <option value="openai">OpenAI (GPT-4o)</option>
                </select>
              </div>

              {/* API Key Input */}
              <div>
                <span
                  className={`text-[10px] uppercase font-bold mb-1 block ${theme.subtext}`}
                >
                  Custom API Key{" "}
                  <span className="font-normal normal-case">(Optional)</span>
                </span>
                <input
                  type="password"
                  value={userApiKey}
                  onChange={(e) => setUserApiKey(e.target.value)}
                  placeholder={
                    provider === "openai" ? "sk-proj-..." : "AIzaSy..."
                  }
                  className={`w-full p-2 rounded border outline-none ${theme.input}`}
                />
                <p className="text-[10px] mt-1 text-gray-500">
                  *Leave empty to use Server Quota.
                </p>
              </div>
            </div>

            <div className={`p-4 rounded border ${theme.card} shrink-0`}>
              <label className={`font-bold block mb-2 ${theme.label}`}>
                Test Configuration
              </label>
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                className={`w-full p-2 rounded border outline-none mb-2 ${theme.input}`}
              >
                <option value="cypress">Cypress (POM)</option>
                <option value="playwright">Playwright (POM)</option>
                {/* <option value="robot">Robot Framework</option> */}
              </select>
            </div>

            <textarea
              className={`p-4 rounded border outline-none resize-none flex-1 min-h-[200px] ${theme.input}`}
              placeholder="Input Test Case: 'Login with valid user...'"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition shadow-lg disabled:opacity-50 shrink-0 flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  Processing <span className="animate-pulse">...</span>
                </>
              ) : (
                <>Generate Structure </>
              )}
            </button>

            {resultData && resultData.risk_analysis && (
              <div
                className={`border rounded p-4 shadow-lg animate-fade-in shrink-0 ${theme.card}`}
              >
                <div className="flex justify-between mb-2">
                  <span className={`font-bold ${theme.label}`}>
                    Risk Analysis
                  </span>
                  <span
                    className={`px-2 rounded text-xs font-bold flex items-center ${getPriorityColor(
                      resultData.risk_analysis.priority
                    )}`}
                  >
                    {resultData.risk_analysis.priority}
                  </span>
                </div>
                <div className="text-3xl font-bold mb-2">
                  {resultData.risk_analysis.score}/10
                </div>
                <div className="max-h-[100px] overflow-y-auto custom-scrollbar">
                  <p
                    className={`text-xs pt-2 border-t border-dashed ${theme.subtext} border-gray-500`}
                  >
                    {resultData.risk_analysis.reasoning}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-8 flex flex-col gap-4 h-[85vh]">
            {resultData ? (
              <div
                className={`flex flex-col h-full border rounded-lg overflow-hidden shadow-2xl ${
                  isDarkMode ? "border-gray-700" : "border-gray-300"
                }`}
              >
                <div className="flex flex-1 overflow-hidden">
                  <div
                    className={`w-1/3 border-r flex flex-col ${
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
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                      {resultData.generated_files.map(
                        (file: any, idx: Key | null | undefined) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setActiveFile(file);
                              setActiveTab("code");
                            }}
                            className={`w-full text-left px-3 py-2 rounded text-xs truncate transition ${
                              activeFile?.path === file.path
                                ? theme.fileActive
                                : `${theme.text} ${theme.fileListHover}`
                            }`}
                          >
                            {file.path}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="w-2/3 flex flex-col bg-[#0d1117]">
                    <div
                      className={`p-3 border-b text-xs font-mono flex justify-between items-center ${theme.editorHeader}`}
                    >
                      <span
                        className={
                          isDarkMode
                            ? "text-blue-300"
                            : "text-blue-600 font-bold"
                        }
                      >
                        {activeFile?.path || "Select a file..."}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(activeFile?.content)
                          }
                          className="hover:text-green-500 text-gray-500 px-2"
                        >
                          📋
                        </button>
                        <button
                          onClick={downloadFile}
                          className="hover:text-blue-500 text-gray-500 px-2 border-l border-gray-500"
                        >
                          
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto p-4 relative group">
                      <textarea
                        className="w-full h-full bg-transparent text-green-400 font-mono text-xs whitespace-pre-wrap outline-none resize-none"
                        value={activeFile?.content || ""}
                        onChange={(e) => {
                          const newContent = e.target.value;
                          setActiveFile({ ...activeFile, content: newContent });
                          const newFiles = resultData.generated_files.map(
                            (f: { path: any }) =>
                              f.path === activeFile.path
                                ? { ...f, content: newContent }
                                : f
                          );
                          setResultData({
                            ...resultData,
                            generated_files: newFiles,
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div
                  className={`h-1/3 border-t flex flex-col ${
                    isDarkMode
                      ? "border-gray-700 bg-[#0d1117]"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  <div
                    className={`flex border-b ${
                      isDarkMode ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <button
                      className={`px-4 py-2 text-xs font-bold uppercase text-blue-500 border-b-2 border-blue-500`}
                    >
                      Quality Check ({resultData.lint_report?.length || 0})
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {resultData.lint_report?.length > 0 ? (
                      <table className="w-full text-left border-collapse">
                        <thead
                          className={`text-xs sticky top-0 ${theme.tableHeader}`}
                        >
                          <tr>
                            <th className="p-2 pl-4">Sev</th>
                            <th className="p-2">File</th>
                            <th className="p-2">Message</th>
                            <th className="p-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultData.lint_report.map((lint: any) => (
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
                              <td
                                className={`p-2 font-bold ${theme.label} whitespace-nowrap`}
                              >
                                {lint.file.split("/").pop()}
                              </td>
                              <td className={`p-2 ${theme.text}`}>
                                {lint.message}
                              </td>
                              <td className="p-2 text-right">
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
                                    : "🪄 Auto Fix"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-4 text-gray-500 text-center">
                        Code clean
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 ${
                  isDarkMode
                    ? "border-gray-700 text-gray-600"
                    : "border-gray-300 text-gray-400"
                }`}
              >
                <div className="text-4xl">{loading ? "🧠" : "🌗"}</div>
                <p>{loading ? "Thinking..." : "Ready to generate..."}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
