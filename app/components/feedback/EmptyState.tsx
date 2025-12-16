import React from 'react';

export const EmptyState: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
  <div className={`h-full flex flex-col items-center justify-center p-8 transition-colors duration-300 ${isDarkMode ? "bg-[#0d1117] text-gray-400" : "bg-white text-gray-600"} border-2 border-dashed rounded-lg ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}>
    <div className="max-w-2xl w-full flex flex-col items-center text-center">
      <div className={`mb-6 p-6 rounded-full ${isDarkMode ? "bg-blue-900/20" : "bg-blue-50"}`}><span className="text-6xl">🚀</span></div>
      <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-800"}`}>Welcome to QA Copilot</h2>
      <p className="text-sm opacity-70 mb-10 max-w-md mx-auto">Generate production-ready Page Object Model (POM) scripts, detect risks, and auto-fix code issues in seconds.</p>
      {/* Cards Section... (Bisa dipersingkat jika mau, saya tulis full untuk kelengkapan) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-left">
         {/* ... Card Content (sama seperti sebelumnya) ... */}
         <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
            <div className="text-2xl mb-2">⚙️</div><h3 className="font-bold text-sm">1. Configure</h3><p className="text-[11px] opacity-70">Select your framework.</p>
         </div>
         <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
            <div className="text-2xl mb-2">✍️</div><h3 className="font-bold text-sm">2. Describe</h3><p className="text-[11px] opacity-70">Input test case.</p>
         </div>
         <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
            <div className="text-2xl mb-2">✨</div><h3 className="font-bold text-sm">3. Generate</h3><p className="text-[11px] opacity-70">Get code & fix.</p>
         </div>
      </div>
    </div>
  </div>
);