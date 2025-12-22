import React from 'react';
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";

interface DiffModalProps {
  isOpen: boolean;
  oldCode: string;
  newCode: string;
  fileName: string;
  onClose: () => void;
  onApply: () => void;
  isDarkMode: boolean;
  lintId?: number;
}

export const DiffModal: React.FC<DiffModalProps> = ({ isOpen, oldCode, newCode, fileName, onClose, onApply, isDarkMode, lintId }) => {
  if (!isOpen) return null;
  const title = lintId === -1 ? "Review Refinement" : "Review Auto-Fix";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`w-full max-w-6xl h-[85vh] flex flex-col rounded-xl shadow-2xl border overflow-hidden ${isDarkMode ? "bg-[#0d1117] border-gray-700" : "bg-white border-gray-200"}`}>
        <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-gray-700 bg-[#161b22]" : "border-gray-200 bg-gray-50"}`}>
          <div><h3 className={`font-bold text-lg flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}>{title}</h3><p className={`text-xs font-mono opacity-60 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{fileName}</p></div>
          <button onClick={onClose} className="text-2xl opacity-50 hover:opacity-100 hover:text-red-500 transition">&times;</button>
        </div>
        <div className="flex-1 overflow-auto custom-scrollbar relative bg-[#0d1117]">
          <ReactDiffViewer oldValue={oldCode} newValue={newCode} splitView={true} compareMethod={DiffMethod.WORDS} useDarkTheme={isDarkMode} 
            styles={{
              variables: {
                dark: { diffViewerBackground: "#0d1117", diffViewerColor: "#e6edf3", addedBackground: "#0f3622", addedColor: "#e6edf3", removedBackground: "#3f1418", removedColor: "#e6edf3", wordAddedBackground: "#1c6b39", wordRemovedBackground: "#8c2626", gutterBackground: "#0d1117", gutterColor: "#6e7681" },
                light: { diffViewerBackground: "#ffffff", diffViewerColor: "#24292e", addedBackground: "#e6ffed", addedColor: "#24292e", removedBackground: "#ffeef0", removedColor: "#24292e", wordAddedBackground: "#acf2bd", wordRemovedBackground: "#fdb8c0", gutterBackground: "#f6f8fa", gutterColor: "#6e7681" }
              }
            }}
          />
        </div>
        <div className={`p-4 border-t flex justify-end gap-3 ${isDarkMode ? "border-gray-700 bg-[#161b22]" : "border-gray-200 bg-gray-50"}`}>
          <button onClick={onClose} className={`px-4 py-2 rounded text-sm font-bold border transition ${isDarkMode ? "border-gray-600 hover:bg-gray-700 text-gray-300" : "border-gray-300 hover:bg-gray-200 text-gray-600"}`}>Cancel</button>
          <button onClick={onApply} className="px-6 py-2 rounded text-sm font-bold bg-green-600 hover:bg-green-500 text-white shadow-lg transition flex items-center gap-2"><span>Confirm & Apply</span></button>
        </div>
      </div>
    </div>
  );
};