import React from 'react';
import { UserPreferences } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  setPreferences: (prefs: UserPreferences) => void;
  isDarkMode: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  setPreferences,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  const handleChange = (key: keyof UserPreferences, value: string) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    // Simpan ke localStorage agar persisten
    localStorage.setItem('qa_copilot_prefs', JSON.stringify(newPrefs));
  };

  const theme = {
    bg: isDarkMode ? "bg-[#0d1117] border-gray-700 text-white" : "bg-white border-gray-200 text-gray-800",
    header: isDarkMode ? "border-gray-700 bg-[#161b22]" : "border-gray-100 bg-gray-50",
    label: isDarkMode ? "text-gray-300" : "text-gray-700",
    select: isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`w-full max-w-md rounded-xl shadow-2xl border overflow-hidden ${theme.bg}`}>
        
        {/* Header */}
        <div className={`p-4 border-b flex justify-between items-center ${theme.header}`}>
          <h3 className="font-bold text-lg flex items-center gap-2">⚙️ Global Preferences</h3>
          <button onClick={onClose} className="text-2xl opacity-50 hover:opacity-100">&times;</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          {/* 1. Selector Preference */}
          <div>
            <label className={`block text-xs font-bold uppercase mb-2 ${theme.label}`}>Preferred Selector Strategy</label>
            <select
              value={preferences.selectorType}
              onChange={(e) => handleChange("selectorType", e.target.value)}
              className={`w-full p-2.5 rounded border outline-none text-sm ${theme.select}`}
            >
              <option value="data-testid">Prefer [data-testid="..."] (Recommended)</option>
              <option value="id">Prefer ID (#element)</option>
              <option value="class">Prefer Class (.element)</option>
              <option value="text">Prefer Text Content</option>
            </select>
            <p className="text-[10px] opacity-60 mt-1">AI will prioritize this selector type when generating code.</p>
          </div>

          {/* 2. Quote Style */}
          <div>
            <label className={`block text-xs font-bold uppercase mb-2 ${theme.label}`}>Quote Style</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleChange("quoteStyle", "single")}
                className={`p-2 rounded border text-sm transition ${preferences.quoteStyle === 'single' ? 'bg-blue-600 text-white border-blue-600' : theme.select}`}
              >
                'Single Quote'
              </button>
              <button
                onClick={() => handleChange("quoteStyle", "double")}
                className={`p-2 rounded border text-sm transition ${preferences.quoteStyle === 'double' ? 'bg-blue-600 text-white border-blue-600' : theme.select}`}
              >
                "Double Quote"
              </button>
            </div>
          </div>

          {/* 3. Assertion Style */}
          <div>
            <label className={`block text-xs font-bold uppercase mb-2 ${theme.label}`}>Assertion Style</label>
            <select
              value={preferences.assertionStyle}
              onChange={(e) => handleChange("assertionStyle", e.target.value)}
              className={`w-full p-2.5 rounded border outline-none text-sm ${theme.select}`}
            >
              <option value="should">Chai Style (cy.get().should...)</option>
              <option value="expect">BDD Style (expect(x).to.be...)</option>
            </select>
          </div>

        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex justify-end ${theme.header}`}>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg transition"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};