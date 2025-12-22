import React, { useState } from 'react';

interface RefineInputProps {
  onRefine: (instruction: string) => void;
  isLoading: boolean;
  isDarkMode: boolean;
}

export const RefineInput: React.FC<RefineInputProps> = ({ onRefine, isLoading, isDarkMode }) => {
  const [instruction, setInstruction] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instruction.trim()) {
      onRefine(instruction);
      setInstruction(""); 
    }
  };

  const theme = {
    bg: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200",
    input: isDarkMode ? "bg-gray-900 text-white placeholder-gray-500" : "bg-gray-50 text-gray-900 placeholder-gray-400",
    text: isDarkMode ? "text-gray-300" : "text-gray-600",
  };

  return (
    <div className={`mt-4 p-3 rounded-lg border ${theme.bg}`}>
      <label className={`text-xs font-bold uppercase mb-2 block flex items-center gap-2 ${theme.text}`}>
        <span>💬 Interactive Refinement</span>
        <span className="text-[10px] font-normal opacity-70">(Chat with this file)</span>
      </label>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          disabled={isLoading}
          placeholder="Ex: Change login selectors to use ID, Use API request for login..."
          className={`flex-1 px-3 py-2 rounded text-xs border outline-none focus:ring-1 focus:ring-blue-500 transition ${theme.input}`}
        />
        <button
          type="submit"
          disabled={isLoading || !instruction.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded disabled:opacity-50 transition flex items-center gap-2"
        >
          {isLoading ? <span className="animate-spin">⌛</span> : ""}
          {isLoading ? "Refining..." : "Refine"}
        </button>
      </form>
    </div>
  );
};