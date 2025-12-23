import React, { useRef, useEffect, useState } from "react";

interface SmartContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContext: string;
  setHtmlContext: (v: string) => void;
  imageData: string | null;
  setImageData: (v: string | null) => void;
  isDarkMode: boolean;
  onCrawl: (url: string) => void;
  isCrawling: boolean;
}

export const SmartContextModal: React.FC<SmartContextModalProps> = ({
  isOpen,
  onClose,
  htmlContext,
  setHtmlContext,
  imageData,
  setImageData,
  isDarkMode,
  onCrawl,
  isCrawling,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPasting, setIsPasting] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  // Theme configuration
  const theme = {
    bg: isDarkMode
      ? "bg-[#0d1117] border-gray-700 text-white"
      : "bg-white border-gray-200 text-gray-800",
    header: isDarkMode
      ? "border-gray-700 bg-[#161b22]"
      : "border-gray-100 bg-gray-50",
    input: isDarkMode
      ? "bg-gray-900 border-gray-600 text-white"
      : "bg-white border-gray-300 text-gray-900",
    subtext: isDarkMode ? "text-gray-400" : "text-gray-500",
    card: isDarkMode
      ? "bg-gray-800 border-gray-700"
      : "bg-gray-50 border-gray-200",
    highlight: isDarkMode
      ? "border-blue-500 bg-blue-900/20"
      : "border-blue-500 bg-blue-50",
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          e.preventDefault();
          setIsPasting(true);

          const blob = items[i].getAsFile();
          processFile(blob);

          setTimeout(() => setIsPasting(false), 500);
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, setImageData]);

  const processFile = (file: File | Blob | null | undefined) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div
        className={`w-full max-w-3xl rounded-xl shadow-2xl border overflow-hidden flex flex-col max-h-[95vh] ${theme.bg}`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex justify-between items-center ${theme.header}`}
        >
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              Visual & HTML Context
            </h3>
            <p className={`text-xs mt-1 ${theme.subtext}`}>
              Paste (Ctrl+V) a screenshot OR provide HTML snippet.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl opacity-50 hover:opacity-100"
          >
            &times;
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
          <div>
            <label
              className={`block text-xs font-bold uppercase mb-3 ${theme.subtext}`}
            >
              1. UI Screenshot
            </label>

            <input
              type="file"
              accept="image/png, image/jpeg"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />

            {!imageData ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200
                      ${
                        isPasting
                          ? theme.highlight
                          : `${theme.card} hover:border-blue-400 hover:bg-blue-50/10`
                      }
                    `}
              >
                <span
                  className={`text-4xl mb-3 transition-transform ${
                    isPasting ? "scale-125" : ""
                  }`}
                >
                  {isPasting ? "⚡" : ""}
                </span>
                <p className="text-sm font-bold">Click to upload</p>
                <p className={`text-xs mt-1 mb-2 ${theme.subtext}`}>or</p>
                <div
                  className={`px-3 py-1 rounded text-xs font-mono border ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600"
                      : "bg-gray-100 border-gray-300"
                  }`}
                >
                  Paste Image (Ctrl + V)
                </div>
              </div>
            ) : (
              <div
                className={`relative rounded-xl overflow-hidden border group flex justify-center bg-black/20 ${theme.card}`}
              >
                <img
                  src={imageData}
                  alt="Preview"
                  className="object-contain max-h-[300px]"
                />

                <button
                  onClick={() => {
                    setImageData(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-md hover:scale-110"
                  title="Remove image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>

                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-[10px] rounded backdrop-blur-sm">
                  Image Active
                </div>
              </div>
            )}
          </div>

          {/* --- SECTION 2: HTML INPUT --- */}
          <div>
            <label
              className={`block text-xs font-bold uppercase mb-3 ${theme.subtext}`}
            >
              2. HTML Snippet
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter website URL (e.g., https://example.com/login)"
                className={`flex-1 p-2.5 rounded border outline-none text-xs ${theme.input}`}
                onKeyDown={(e) => e.key === "Enter" && onCrawl(urlInput)}
              />
              <button
                onClick={() => onCrawl(urlInput)}
                disabled={isCrawling || !urlInput}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCrawling ? "Crawling..." : "Fetch HTML"}
              </button>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <div
                className={`h-px flex-1 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              ></div>
              <span
                className={`text-[10px] uppercase font-bold ${theme.subtext}`}
              >
                OR PASTE CODE
              </span>
              <div
                className={`h-px flex-1 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              ></div>
            </div>

            <textarea
              value={htmlContext}
              onChange={(e) => setHtmlContext(e.target.value)}
              placeholder='Example: <form id="login-form">...</form>'
              className={`w-full p-4 rounded border outline-none font-mono text-xs resize-y ${theme.input}`}
              style={{ minHeight: "150px" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center ${theme.header}`}>
          {(imageData || htmlContext) && (
            <button
              onClick={() => {
                setHtmlContext("");
                setImageData(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-xs text-red-500 hover:underline animate-in fade-in slide-in-from-left-2 duration-200"
            >
              Clear All Context
            </button>
          )}

          <button
            onClick={onClose}
            className="ml-auto px-6 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg transition"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
