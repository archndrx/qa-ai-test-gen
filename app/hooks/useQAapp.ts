import { useState, useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  ResultData,
  GeneratedFile,
  LintItem,
  UserPreferences,
  HistoryItem,
} from "../types";

export const useQAapp = () => {
  // --- STATE ---
  const [input, setInput] = useState("");
  const [framework, setFramework] = useState("cypress");
  const [provider, setProvider] = useState("gemini");
  const [userApiKey, setUserApiKey] = useState("");

  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeFile, setActiveFile] = useState<GeneratedFile | null>(null);
  const [activeTab, setActiveTab] = useState("code");

  const [fixingId, setFixingId] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [explanationData, setExplanationData] = useState<{
    show: boolean;
    content: string;
    isLoading: boolean;
  }>({
    show: false,
    content: "",
    isLoading: false,
  });

  const [showFixtureModal, setShowFixtureModal] = useState(false);
  const [fixtureResult, setFixtureResult] = useState("");
  const [isGeneratingFixture, setIsGeneratingFixture] = useState(false);

  // Modal States
  const [showSettings, setShowSettings] = useState(false);
  const [showSmartContextModal, setShowSmartContextModal] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);

  // Context States
  const [htmlContext, setHtmlContext] = useState("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [isCrawling, setIsCrawling] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  const [preferences, setPreferences] = useState<UserPreferences>({
    selectorType: "data-testid",
    quoteStyle: "single",
    assertionStyle: "should",
  });

  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const [diffModal, setDiffModal] = useState<{
    show: boolean;
    oldCode: string;
    newCode: string;
    fileName: string;
    lintId: number;
  } | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);

  // --- EFFECTS ---
  useEffect(() => {
    const savedHistory = localStorage.getItem("qa_copilot_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
    const saved = localStorage.getItem("qa_copilot_prefs");
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse preferences");
      }
    }
  }, []);

  // --- ACTIONS ---
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const saveToHistory = (
    inputCase: string,
    frameworkName: string,
    data: ResultData
  ) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      testCase: inputCase,
      framework: frameworkName,
      resultData: data,
    };

    const newHistory = [newItem, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem("qa_copilot_history", JSON.stringify(newHistory));
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setInput(item.testCase);
    setFramework(item.framework);

    const processedFiles = item.resultData.generated_files.map((f) => ({
      ...f,
      originalContent: f.originalContent || f.content,
    }));

    const processedResult = {
      ...item.resultData,
      generated_files: processedFiles,
    };

    setResultData(processedResult);

    if (processedFiles.length > 0) {
      setActiveFile(processedFiles[0]);
    }
    setShowHistorySidebar(false);
    showToast("Project loaded from history!");
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newHistory = history.filter((item) => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem("qa_copilot_history", JSON.stringify(newHistory));
  };

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
          framework,
          provider,
          userApiKey,
          preferences,
          htmlContext,
          imageData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request server");

      const parsed = JSON.parse(data.result);
      if (parsed.generated_files) {
        parsed.generated_files = parsed.generated_files.map(
          (f: GeneratedFile) => ({
            ...f,
            originalContent: f.content,
          })
        );
      }

      if (parsed.lint_report) {
        parsed.lint_report = parsed.lint_report.map(
          (item: any, idx: number) => ({ ...item, id: idx })
        );
      }
      setResultData(parsed);
      if (parsed.generated_files?.length > 0)
        setActiveFile(parsed.generated_files[0]);
      saveToHistory(input, framework, parsed);
    } catch (err: any) {
      alert(err.message || "Failed to connect server");
    } finally {
      setLoading(false);
    }
  };

  const handleFixCode = async (lintItem: LintItem) => {
    if (!resultData) return;
    const targetFile = resultData.generated_files.find((f) =>
      f.path.includes(lintItem.file)
    );
    if (!targetFile) return alert("File not found.");

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
          provider,
          userApiKey,
          preferences,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setDiffModal({
          show: true,
          oldCode: targetFile.content,
          newCode: data.result,
          fileName: targetFile.path,
          lintId: lintItem.id,
        });
      }
    } catch (e) {
      alert("Failed to fetch code fix.");
    } finally {
      setFixingId(null);
    }
  };

  const applyFix = () => {
    if (!diffModal || !resultData) return;
    const updatedFiles = resultData.generated_files.map((f) =>
      f.path === diffModal.fileName
        ? {
            ...f,
            content: diffModal.newCode,
            originalContent: diffModal.newCode,
          }
        : f
    );

    let updatedLint = resultData.lint_report;
    if (diffModal.lintId !== -1) {
      updatedLint = resultData.lint_report.filter(
        (l) => l.id !== diffModal.lintId
      );
    }

    setResultData({
      ...resultData,
      generated_files: updatedFiles,
      lint_report: updatedLint,
    });

    if (activeFile && activeFile.path === diffModal.fileName) {
      setActiveFile({
        ...activeFile,
        content: diffModal.newCode,
        originalContent: diffModal.newCode,
      });
    }
    showToast("Changes applied successfully!");
    setDiffModal(null);
  };

  const handleDownloadZip = async () => {
    if (!resultData?.generated_files) return;

    try {
      const zip = new JSZip();
      resultData.generated_files.forEach((file) =>
        zip.file(file.path, file.content)
      );

      //  --- Boilerplate & Scaffolding ---
      // CYPRESS
      if (framework === "cypress") {
        // package.json
        zip.file(
          "package.json",
          JSON.stringify(
            {
              name: "qa-copilot-test",
              version: "1.0.0",
              scripts: {
                "cypress:open": "cypress open",
                "cypress:run": "cypress run",
              },
              devDependencies: {
                cypress: "^13.0.0",
              },
            },
            null,
            2
          )
        );

        // cypress.config.js
        zip.file(
          "cypress.config.js",
          `
          const { defineConfig } = require("cypress");

          module.exports = defineConfig({
            e2e: {
              setupNodeEvents(on, config) {
                // implement node event listeners here
              },
            },
          });
          `
        );

        // E2E Support File
        zip.file(
          "cypress/support/e2e.js",
          "// Import commands.js using ES2015 syntax:\nimport './commands';"
        );
        zip.file("cypress/support/commands.js", "// Custom commands go here");
      }

      // B. PLAYWRIGHT
      else if (framework === "playwright") {
        // package.json
        zip.file(
          "package.json",
          JSON.stringify(
            {
              name: "qa-copilot-test",
              version: "1.0.0",
              scripts: {
                test: "npx playwright test",
                "test:ui": "npx playwright test --ui",
              },
              devDependencies: {
                "@playwright/test": "^1.40.0",
                "@types/node": "^20.0.0",
              },
            },
            null,
            2
          )
        );

        // playwright.config.ts
        zip.file(
          "playwright.config.ts",
          `
          import { defineConfig, devices } from '@playwright/test';

          export default defineConfig({
            testDir: './tests',
            fullyParallel: true,
            forbidOnly: !!process.env.CI,
            retries: process.env.CI ? 2 : 0,
            workers: process.env.CI ? 1 : undefined,
            reporter: 'html',
            use: {
              trace: 'on-first-retry',
            },
            projects: [
              {
                name: 'chromium',
                use: { ...devices['Desktop Chrome'] },
              },
            ],
          });
          `
        );
      }

      // 3. README.MD
      zip.file(
        "README.md",
        `
        # QA Copilot Generated Project 

        This project was automatically generated by QA Copilot.

        ## How to Run

        1. Install dependencies:
          \`\`\`bash
          npm install
          \`\`\`

        2. Run Tests:
          ${
            framework === "cypress"
              ? "```bash\nnpm run cypress:open\n```"
              : "```bash\nnpm run test\n```"
          }
        `
      );
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `qa-copilot-${framework}-project.zip`);
      showToast("Project downloaded with boilerplate!");
    } catch (error) {
      console.error(error);
      showToast("Failed to download ZIP", "error");
    }
  };

  const updateActiveFileContent = (newContent: string) => {
    if (!activeFile || !resultData) return;
    setActiveFile({ ...activeFile, content: newContent });
    const newFiles = resultData.generated_files.map((f) =>
      f.path === activeFile.path ? { ...f, content: newContent } : f
    );
    setResultData({ ...resultData, generated_files: newFiles });
  };

  const validLintItems =
    resultData?.lint_report?.filter((lint) => {
      const targetFile = resultData?.generated_files?.find((f) =>
        f.path.includes(lint.file)
      );
      return targetFile && lint.file.length > 2 && lint.file !== "N/A";
    }) || [];

  const handleCrawlUrl = async (url: string) => {
    if (!url) return;

    if (!url.startsWith("http")) {
      showToast("URL must start with http:// or https://", "error");
      return;
    }

    setIsCrawling(true);
    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to crawl");
      }

      setHtmlContext(data.html);
      showToast("URL crawled successfully! HTML extracted.");
    } catch (err: any) {
      console.error(err);
      showToast(
        err.message || "Failed to fetch URL. Make sure the website is public.",
        "error"
      );
    } finally {
      setIsCrawling(false);
    }
  };

  const handleRefineCode = async (instruction: string) => {
    if (!activeFile || !instruction.trim()) return;

    setIsRefining(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refine",
          currentCode: activeFile.content,
          refineInstruction: instruction,
          framework,
          provider,
          userApiKey,
          preferences,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to refine code");

      setDiffModal({
        show: true,
        oldCode: activeFile.content,
        newCode: data.result,
        fileName: activeFile.path,
        lintId: -1,
      });
    } catch (err: any) {
      showToast(err.message || "Failed to refine code", "error");
    } finally {
      setIsRefining(false);
    }
  };

  const handleExplainCode = async (snippet: string) => {
    if (!snippet.trim()) return;

    setExplanationData({ show: true, content: "", isLoading: true });

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "explain",
          currentCode: snippet,
          framework,
          provider,
          userApiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to explain");

      setExplanationData({
        show: true,
        content: data.result,
        isLoading: false,
      });
    } catch (err: any) {
      showToast(err.message || "Failed to explain code", "error");
      setExplanationData((prev) => ({
        ...prev,
        show: false,
        isLoading: false,
      }));
    }
  };

  const closeExplanation = () => {
    setExplanationData({ show: false, content: "", isLoading: false });
  };

  const handleGenerateFixture = async (request: string, format: string) => {
    if (!request.trim()) return;

    setIsGeneratingFixture(true);
    setFixtureResult(""); // Reset output

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_fixture",
          fixtureRequest: request,
          fixtureFormat: format,
          provider,
          userApiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal generate data");

      setFixtureResult(data.result);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsGeneratingFixture(false);
    }
  };

  const handleSaveFixtureToWorkspace = (content: string, format: string) => {
    const ext = format === "sql" ? "sql" : format === "csv" ? "csv" : "json";
    const folder =
      framework === "cypress" ? "cypress/fixtures" : "tests/fixtures";
    const defaultName = `mock_data_${Date.now()}.${ext}`;

    const fileName = window.prompt("Enter filename:", defaultName);
    if (!fileName) return; // Cancelled

    const fullPath = `${folder}/${fileName}`;
    const newFile: GeneratedFile = {
      path: fullPath,
      content: content,
      originalContent: content,
    };

    setResultData((prev) => {
      const base = prev || {
        risk_analysis: {
          score: 0,
          priority: "Low",
          reasoning: "Manual Fixture Generation",
        },
        lint_report: [],
        generated_files: [],
      };

      return {
        ...base,
        generated_files: [...base.generated_files, newFile],
      };
    });

    setActiveFile(newFile);
    setActiveTab("code");
    setShowFixtureModal(false);
    showToast(`File saved as ${fileName}!`);
  };

  const handleDebugError = async (errorLog: string) => {
    if (!activeFile || !errorLog.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refine",
          currentCode: activeFile.content,
          refineInstruction: `FIX THIS ERROR: ${errorLog}. \n\nAnalyze the code and the error, then provide the corrected code.`,
          framework,
          provider,
          userApiKey,
          preferences,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setDiffModal({
        show: true,
        oldCode: activeFile.content,
        newCode: data.result,
        fileName: activeFile.path,
        lintId: -1,
      });
      setShowDebugModal(false);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return {
    // 1. INPUT STATES
    input,
    setInput,
    framework,
    setFramework,
    provider,
    setProvider,
    userApiKey,
    setUserApiKey,

    // 2. APP DATA STATES
    resultData,
    loading,
    activeFile,
    setActiveFile,
    activeTab,
    setActiveTab,
    fixingId,
    explanationData,
    handleExplainCode,
    closeExplanation,

    // 3. UI STATES
    isDarkMode,
    setIsDarkMode,
    diffModal,
    setDiffModal,
    toast,
    setToast,
    showSettings,
    setShowSettings,
    showSmartContextModal,
    setShowSmartContextModal,
    showDebugModal,
    setShowDebugModal,
    handleDebugError,

    // 4. CONTEXT STATES (HTML & IMAGE)
    htmlContext,
    setHtmlContext,
    imageData,
    setImageData,
    isCrawling,
    handleCrawlUrl,
    isRefining,
    handleRefineCode,

    // 5. HISTORY STATES
    history,
    showHistorySidebar,
    setShowHistorySidebar,
    loadHistoryItem,
    deleteHistoryItem,

    // 6. LOGIC & ACTIONS
    validLintItems,
    preferences,
    setPreferences,
    handleGenerate,
    handleFixCode,
    applyFix,
    handleDownloadZip,
    updateActiveFileContent,
    showToast,
    showFixtureModal,
    setShowFixtureModal,
    fixtureResult,
    isGeneratingFixture,
    handleGenerateFixture,
    handleSaveFixtureToWorkspace,
  };
};
