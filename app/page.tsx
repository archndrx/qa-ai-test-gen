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
import { SmartContextModal } from "./components/modals/SmartContextModal";
import { HistorySidebar } from "./components/workspace/HistorySidebar";
import { FixtureModal } from "./components/modals/FixtureModal";
import { DebugModal } from "./components/modals/DebugModal";

export default function Home() {
  const {
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
  } = useQAapp();

  const theme = getTheme(isDarkMode);

  return (
    <div
      className={`min-h-screen font-mono text-sm transition-colors duration-300 ${theme.bg} ${theme.text} p-6`}
    >
      <div className="max-w-[1600px] mx-auto">
        {/* HEADER */}
        <Header
          isDarkMode={isDarkMode}
          toggleTheme={() => setIsDarkMode(!isDarkMode)}
          openSettings={() => setShowSettings(true)}
          openHistory={() => setShowHistorySidebar(true)}
          onOpenFixtureModal={() => setShowFixtureModal(true)}
        />

        {/* MAIN GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: CONTROL PANEL */}
          <ControlPanel
            isDarkMode={isDarkMode}
            // API Settings
            provider={provider}
            setProvider={setProvider}
            userApiKey={userApiKey}
            setUserApiKey={setUserApiKey}
            // Test Config
            framework={framework}
            setFramework={setFramework}
            // Input Area
            input={input}
            setInput={setInput}
            // Smart Context
            htmlContext={htmlContext}
            setHtmlContext={setHtmlContext}
            imageData={imageData}
            openSmartContext={() => setShowSmartContextModal(true)}
            // Actions
            handleGenerate={handleGenerate}
            loading={loading}
            resultData={resultData}
          />

          {/* RIGHT COLUMN: WORKSPACE */}
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
                handleRefineCode={handleRefineCode}
                isRefining={isRefining}
                explanationData={explanationData}
                handleExplainCode={handleExplainCode}
                closeExplanation={closeExplanation}
                onOpenDebug={() => setShowDebugModal(true)}
              />
            ) : loading ? (
              <LoadingState isDarkMode={isDarkMode} />
            ) : (
              <EmptyState isDarkMode={isDarkMode} />
            )}
          </div>
        </div>
      </div>

      {/* --- MODALS SECTION --- */}

      <HistorySidebar
        isOpen={showHistorySidebar}
        onClose={() => setShowHistorySidebar(false)}
        history={history}
        onLoad={loadHistoryItem}
        onDelete={deleteHistoryItem}
        isDarkMode={isDarkMode}
      />

      <FixtureModal
        isOpen={showFixtureModal}
        onClose={() => setShowFixtureModal(false)}
        isDarkMode={isDarkMode}
        onGenerate={handleGenerateFixture}
        isLoading={isGeneratingFixture}
        result={fixtureResult}
        onSaveToWorkspace={handleSaveFixtureToWorkspace}
      />

      <DebugModal
          isOpen={showDebugModal}
          onClose={() => setShowDebugModal(false)}
          isDarkMode={isDarkMode}
          onAnalyze={handleDebugError}
          isLoading={loading}
       />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        preferences={preferences}
        setPreferences={setPreferences}
        isDarkMode={isDarkMode}
      />

      <SmartContextModal
        isOpen={showSmartContextModal}
        onClose={() => setShowSmartContextModal(false)}
        htmlContext={htmlContext}
        setHtmlContext={setHtmlContext}
        imageData={imageData}
        setImageData={setImageData}
        isDarkMode={isDarkMode}
        isCrawling={isCrawling}
        onCrawl={handleCrawlUrl}
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
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
