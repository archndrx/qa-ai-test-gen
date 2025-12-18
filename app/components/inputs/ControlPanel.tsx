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
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isDarkMode, provider, setProvider, userApiKey, setUserApiKey,
  framework, setFramework, input, setInput, handleGenerate, loading, resultData
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
        <textarea
          className={`p-4 rounded border outline-none resize-none flex-1 ${theme.input}`}
          placeholder="Input Test Case: 'Login with valid user...'"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (!loading) handleGenerate(); } }}
        />
        {/* Helper Text */}
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