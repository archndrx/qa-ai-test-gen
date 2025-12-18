"use client";

import { useQAapp } from "./hooks/useQAapp";
import { getTheme } from "./utils/theme";
import { Header } from "./components/Header";
import { ControlPanel } from "./components/inputs/ControlPanel";
import { Workspace } from "./components/workspace/Workspace";
import { LoadingState } from "./components/feedback/LoadingState";
import { EmptyState } from "./components/feedback/EmptyState";
import { DiffModal } from "./components/feedback/DiffModal";
import { Toast } from "./components/feedback/Toast";
import { SettingsModal } from "./components/modals/SettingsModal";

export default function Home() {
  const {
    input, setInput,
    framework, setFramework,
    provider, setProvider,
    userApiKey, setUserApiKey,
    resultData, loading,
    activeFile, setActiveFile,
    activeTab, setActiveTab,
    fixingId,
    isDarkMode, setIsDarkMode,
    diffModal, setDiffModal,
    toast, setToast,
    validLintItems,
    handleGenerate,
    handleFixCode,
    applyFix,
    handleDownloadZip,
    updateActiveFileContent,
    showToast,
    showSettings, setShowSettings,
    preferences, setPreferences
  } = useQAapp();

  const theme = getTheme(isDarkMode);

  return (
    <div className={`min-h-screen font-mono text-sm transition-colors duration-300 ${theme.bg} ${theme.text} p-6`}>
      <div className="max-w-[1600px] mx-auto">
        
        {/* TOP HEADER */}
        <Header 
            isDarkMode={isDarkMode} 
            toggleTheme={() => setIsDarkMode(!isDarkMode)} 
            openSettings={() => setShowSettings(true)} 
        />

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: CONTROLS */}
          <ControlPanel
            isDarkMode={isDarkMode}
            provider={provider} setProvider={setProvider}
            userApiKey={userApiKey} setUserApiKey={setUserApiKey}
            framework={framework} setFramework={setFramework}
            input={input} setInput={setInput}
            handleGenerate={handleGenerate}
            loading={loading}
            resultData={resultData}
          />

          {/* RIGHT: WORKSPACE / LOADING / EMPTY */}
          <div className="lg:col-span-8 flex flex-col gap-4 h-[calc(100vh-6rem)] custom-scrollbar">
            {resultData ? (
              <Workspace
                isDarkMode={isDarkMode}
                resultData={resultData}
                activeFile={activeFile}
                setActiveFile={setActiveFile}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                updateActiveFileContent={updateActiveFileContent}
                validLintItems={validLintItems}
                handleFixCode={handleFixCode}
                fixingId={fixingId}
                handleDownloadZip={handleDownloadZip}
                showToast={showToast}
              />
            ) : loading ? (
              <LoadingState isDarkMode={isDarkMode} />
            ) : (
              <EmptyState isDarkMode={isDarkMode} />
            )}
          </div>
        </div>
      </div>

      {/* OVERLAYS */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        preferences={preferences}
        setPreferences={setPreferences}
        isDarkMode={isDarkMode}
      />
      
      {diffModal && diffModal.show && (
        <DiffModal
          isOpen={diffModal.show}
          oldCode={diffModal.oldCode}
          newCode={diffModal.newCode}
          fileName={diffModal.fileName}
          onClose={() => setDiffModal(null)}
          onApply={applyFix}
          isDarkMode={isDarkMode}
        />
      )}

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}