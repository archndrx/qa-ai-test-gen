import React from 'react';

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleTheme }) => (
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-2xl font-bold text-center text-blue-500">QA Copilot</h1>
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full transition ${isDarkMode ? "bg-yellow-400 text-black" : "bg-gray-800 text-white"}`}
    >
      {isDarkMode ? "☀️" : "🌙"}
    </button>
  </div>
);