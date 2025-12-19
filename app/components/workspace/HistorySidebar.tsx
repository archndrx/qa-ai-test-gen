import React from 'react';
import { HistoryItem } from '../../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  isDarkMode: boolean;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen, onClose, history, onLoad, onDelete, isDarkMode
}) => {
  const theme = {
    bg: isDarkMode ? "bg-[#0d1117] border-l border-gray-700" : "bg-white border-l border-gray-200",
    text: isDarkMode ? "text-gray-300" : "text-gray-700",
    itemBg: isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-50",
    subtext: isDarkMode ? "text-gray-500" : "text-gray-500",
    emptyIcon: isDarkMode ? "opacity-20" : "opacity-10",
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${theme.bg} ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <h3 className={`font-bold text-lg ${theme.text}`}>Recent Projects</h3>
            <button onClick={onClose} className="text-2xl opacity-50 hover:opacity-100">&times;</button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <p className={`text-sm ${theme.subtext}`}>No history yet.</p>
                <p className={`text-xs ${theme.subtext}`}>Generate code to save projects automatically.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => onLoad(item)}
                    className={`p-3 rounded-lg border cursor-pointer transition group relative ${theme.itemBg} ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                  >
                    {/* Content */}
                    <div className="pr-6">
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.framework === 'cypress' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {item.framework === 'cypress' ? 'CY' : 'PW'}
                            </span>
                            <span className={`text-[10px] ${theme.subtext}`}>
                                {new Date(item.timestamp).toLocaleDateString()}
                            </span>
                        </div>
                        <p className={`text-xs font-medium truncate ${theme.text}`} title={item.testCase}>
                            {item.testCase}
                        </p>
                    </div>

                    <button
                        onClick={(e) => onDelete(e, item.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                        title="Delete"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};