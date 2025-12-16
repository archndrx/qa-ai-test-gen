import React from 'react';

export const LoadingState: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
  <div className={`flex flex-col h-full items-center justify-center border rounded-lg shadow-xl p-8 ${isDarkMode ? "border-gray-800 bg-[#0d1117]" : "border-gray-200 bg-white"}`}>
    <div className="flex flex-col items-center text-center max-w-md animate-fade-in-up">
      <div className="relative mb-6">
        <div className={`w-16 h-16 rounded-full border-4 border-t-transparent animate-spin ${isDarkMode ? "border-blue-500" : "border-blue-600"}`}></div>
        <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">🤖</div>
      </div>
      <h3 className={`text-xl font-bold mb-2 tracking-tight ${isDarkMode ? "text-white" : "text-gray-800"}`}>Generating Test Suite...</h3>
      <p className={`text-sm leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>AI is analyzing your requirements, defining Page Object Models, and writing robust test scenarios.</p>
    </div>
  </div>
);