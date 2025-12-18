interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  openSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleTheme, openSettings }) => (
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-2xl font-bold text-center text-blue-500">QA Copilot</h1>
    
    <div className="flex gap-2">
      <button
        onClick={openSettings}
        className={`p-2 rounded-full transition ${isDarkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        title="Global Preferences"
      >
        ⚙️
      </button>

      <button
        onClick={toggleTheme}
        className={`p-2 rounded-full transition ${isDarkMode ? "bg-yellow-400 text-black" : "bg-gray-800 text-white"}`}
      >
        {isDarkMode ? "☀️" : "🌙"}
      </button>
    </div>
  </div>
);