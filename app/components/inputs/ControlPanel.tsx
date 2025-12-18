import React from 'react';
import { getTheme, getPriorityColor } from '../../utils/theme';
import { ResultData } from '../../types';

interface ControlPanelProps {
  isDarkMode: boolean;
  provider: string;
  setProvider: (v: string) => void;
  userApiKey: string;
  setUserApiKey: (v: string) => void;
  framework: string;
  setFramework: (v: string) => void;
  input: string;
  setInput: (v: string) => void;
  handleGenerate: () => void;
  loading: boolean;
  resultData: ResultData | null;
  htmlContext: string;
  setHtmlContext: (v: string) => void;
  openSmartContext: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isDarkMode, provider, setProvider, userApiKey, setUserApiKey,
  framework, setFramework, input, setInput, handleGenerate, loading, resultData,
  htmlContext, openSmartContext
}) => {
  const theme = getTheme(isDarkMode);

  return (
    <div className="lg:col-span-4 flex flex-col gap-4 sticky top-6 h-[calc(100vh-6rem)] overflow-y-auto pr-1 custom-scrollbar">
      {/* API SETTINGS */}
      <div className={`p-4 rounded border ${theme.card} shrink-0`}>
        <label className={`font-bold block mb-3 flex items-center gap-2 ${theme.label}`}>AI Settings</label>
        <div className="mb-3">
          <span className={`text-[10px] uppercase font-bold mb-1 block ${theme.subtext}`}>Select Provider</span>
          <select value={provider} onChange={(e) => setProvider(e.target.value)} className={`w-full p-2 rounded border outline-none ${theme.input}`}>
            <option value="gemini">Google Gemini (Flash 2.5)</option>
            <option value="openai">OpenAI (GPT-4o)</option>
          </select>
        </div>
        <div>
          <span className={`text-[10px] uppercase font-bold mb-1 block ${theme.subtext}`}>Custom API Key</span>
          <input type="password" value={userApiKey} onChange={(e) => setUserApiKey(e.target.value)} placeholder={provider === "openai" ? "sk-proj-..." : "AIzaSy..."} className={`w-full p-2 rounded border outline-none ${theme.input}`} />
          {/* <p className="text-[10px] mt-1 text-gray-500">*Leave empty to use Server Quota.</p> */}
        </div>
      </div>

      {/* TEST CONFIG */}
      <div className={`p-4 rounded border ${theme.card} shrink-0`}>
        <label className={`font-bold block mb-2 ${theme.label}`}>Test Configuration</label>
        <select value={framework} onChange={(e) => setFramework(e.target.value)} className={`w-full p-2 rounded border outline-none mb-2 ${theme.input}`}>
          <option value="cypress">Cypress (POM)</option>
          <option value="playwright">Playwright (POM)</option>
        </select>
      </div>

      {/* INPUT */}
      <div className="flex flex-col flex-1 min-h-[200px]">
        <div className="flex justify-between items-end mb-2">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${theme.subtext}`}>
              Test Scenario
            </span>
            
            <button
                onClick={openSmartContext}
                className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-all duration-200 font-medium ${
                    htmlContext 
                    ? 
                      isDarkMode
                        ? "bg-green-900/30 text-green-400 border-green-800 hover:bg-green-900/50" 
                        : "bg-green-50 text-green-700 border-green-200 shadow-sm hover:bg-green-100"
                    : 
                      isDarkMode
                        ? "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-gray-200"
                        : "bg-white text-gray-600 border-gray-300 shadow-sm hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400"
                }`}
            >
                {htmlContext ? (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>Context Active</span>
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                        <span>Add HTML Context</span>
                    </>
                )}
            </button>
        </div>

        <textarea
          className={`p-4 rounded border outline-none resize-none flex-1 ${theme.input}`}
          placeholder="Input Test Case: 'Login with valid user...'"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (!loading) handleGenerate(); } }}
        />
        <div className={`text-[10px] text-right mt-1 flex justify-end gap-1 items-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
           <span>Press <kbd className="font-bold">Ctrl</kbd> + <kbd className="font-bold">Enter</kbd> to generate</span>
        </div>
      </div>

      <button onClick={handleGenerate} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition shadow-lg disabled:opacity-50 shrink-0 flex justify-center items-center gap-2">
        {loading ? <>Processing <span className="animate-pulse">...</span></> : <>Generate Structure</>}
      </button>

      {/* RISK ANALYSIS */}
      {resultData && resultData.risk_analysis && (
        <div className={`border rounded p-4 shadow-lg animate-fade-in shrink-0 ${theme.card}`}>
          <div className="flex justify-between mb-2">
            <span className={`font-bold ${theme.label}`}>Risk Analysis</span>
            <span className={`px-2 rounded text-xs font-bold flex items-center ${getPriorityColor(resultData.risk_analysis.priority)}`}>
              {resultData.risk_analysis.priority}
            </span>
          </div>
          <div className="text-3xl font-bold mb-2">{resultData.risk_analysis.score}/10</div>
          <div className="mt-2">
            <p className={`text-xs pt-2 border-t border-dashed ${theme.subtext} border-gray-500`}>{resultData.risk_analysis.reasoning}</p>
          </div>
        </div>
      )}
    </div>
  );
};