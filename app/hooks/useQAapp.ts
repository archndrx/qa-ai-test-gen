import { useState, useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ResultData, GeneratedFile, LintItem, UserPreferences, HistoryItem } from "../types";

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
  
  // Modal States
  const [showSettings, setShowSettings] = useState(false);
  const [showSmartContextModal, setShowSmartContextModal] = useState(false);
  
  // Context States
  const [htmlContext, setHtmlContext] = useState("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [isCrawling, setIsCrawling] = useState(false);

  const [preferences, setPreferences] = useState<UserPreferences>({
    selectorType: "data-testid",
    quoteStyle: "single",
    assertionStyle: "should"
  });
  
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  
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
    const savedHistory = localStorage.getItem('qa_copilot_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
    const saved = localStorage.getItem('qa_copilot_prefs');
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

  const saveToHistory = (inputCase: string, frameworkName: string, data: ResultData) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      testCase: inputCase,
      framework: frameworkName,
      resultData: data
    };

    const newHistory = [newItem, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('qa_copilot_history', JSON.stringify(newHistory));
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setInput(item.testCase);
    setFramework(item.framework);
    setResultData(item.resultData);
    if (item.resultData.generated_files.length > 0) {
      setActiveFile(item.resultData.generated_files[0]);
    }
    setShowHistorySidebar(false);
    showToast("Project loaded from history! 📂");
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem('qa_copilot_history', JSON.stringify(newHistory));
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
            imageData 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal request ke server");

      const parsed = JSON.parse(data.result);
      if (parsed.lint_report) {
        parsed.lint_report = parsed.lint_report.map((item: any, idx: number) => ({ ...item, id: idx }));
      }
      setResultData(parsed);
      if (parsed.generated_files?.length > 0) setActiveFile(parsed.generated_files[0]);
      saveToHistory(input, framework, parsed);
    } catch (err: any) {
      alert(err.message || "Gagal connect server");
    } finally {
      setLoading(false);
    }
  };

  const handleFixCode = async (lintItem: LintItem) => {
    if (!resultData) return;
    const targetFile = resultData.generated_files.find((f) => f.path.includes(lintItem.file));
    if (!targetFile) return alert("File tidak ditemukan.");

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
      alert("Gagal mengambil perbaikan kode.");
    } finally {
      setFixingId(null);
    }
  };

  const applyFix = () => {
    if (!diffModal || !resultData) return;
    const updatedFiles = resultData.generated_files.map((f) =>
      f.path === diffModal.fileName ? { ...f, content: diffModal.newCode } : f
    );
    const updatedLint = resultData.lint_report.filter((l) => l.id !== diffModal.lintId);

    setResultData({ ...resultData, generated_files: updatedFiles, lint_report: updatedLint });
    if (activeFile && activeFile.path === diffModal.fileName) {
      setActiveFile({ ...activeFile, content: diffModal.newCode });
    }
    showToast("Fix applied successfully! 🚀");
    setDiffModal(null);
  };

  const handleDownloadZip = async () => {
    if (!resultData?.generated_files) return;
    try {
      const zip = new JSZip();
      resultData.generated_files.forEach((file) => zip.file(file.path, file.content));
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "qa-copilot-project.zip");
      showToast("Project downloaded as ZIP! 📦");
    } catch (error) {
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

  const validLintItems = resultData?.lint_report?.filter((lint) => {
    const targetFile = resultData?.generated_files?.find((f) => f.path.includes(lint.file));
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
      showToast("URL crawled successfully! HTML extracted. 🕷️");
      
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Gagal mengambil URL. Pastikan website publik.", "error");
    } finally {
      setIsCrawling(false);
    }
  };

  return {
    // 1. INPUT STATES
    input, setInput,
    framework, setFramework,
    provider, setProvider,
    userApiKey, setUserApiKey,
    
    // 2. APP DATA STATES
    resultData, loading,
    activeFile, setActiveFile,
    activeTab, setActiveTab,
    fixingId,
    
    // 3. UI STATES
    isDarkMode, setIsDarkMode,
    diffModal, setDiffModal,
    toast, setToast,
    showSettings, setShowSettings,
    showSmartContextModal, setShowSmartContextModal,
    
    // 4. CONTEXT STATES (HTML & IMAGE)
    htmlContext, setHtmlContext,
    imageData, setImageData,
    isCrawling, handleCrawlUrl,

    // 5. HISTORY STATES (BARU)
    history, 
    showHistorySidebar, setShowHistorySidebar,
    loadHistoryItem, deleteHistoryItem,
    
    // 6. LOGIC & ACTIONS
    validLintItems,
    preferences, setPreferences,
    handleGenerate,
    handleFixCode,
    applyFix,
    handleDownloadZip,
    updateActiveFileContent,
    showToast
  };

  
};