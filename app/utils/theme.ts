export const getTheme = (isDarkMode: boolean) => ({
  bg: isDarkMode ? "bg-gray-900" : "bg-gray-50",
  text: isDarkMode ? "text-white" : "text-gray-800",
  card: isDarkMode
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200 shadow-lg",
  input: isDarkMode
    ? "bg-gray-900 border-gray-600 focus:border-blue-500 text-white"
    : "bg-white border-gray-300 focus:border-blue-500 text-gray-900",
  label: isDarkMode ? "text-gray-400" : "text-gray-600",
  subtext: isDarkMode ? "text-gray-500" : "text-gray-500",
  fileListBg: isDarkMode ? "bg-gray-800" : "bg-gray-100",
  fileListHover: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200",
  fileActive: isDarkMode ? "bg-blue-600 text-white" : "bg-blue-600 text-white",
  editorHeader: isDarkMode
    ? "bg-[#161b22] border-gray-700"
    : "bg-gray-200 border-gray-300",
  tableHeader: isDarkMode
    ? "bg-gray-800 text-gray-400"
    : "bg-gray-100 text-gray-600",
  tableRow: isDarkMode
    ? "border-gray-800 hover:bg-gray-800/50"
    : "border-gray-200 hover:bg-gray-50",
});

export const getPriorityColor = (p: string) => {
  const priority = p ? p.toLowerCase() : "low";
  if (priority === "high") return "bg-red-600 text-white";
  if (priority === "medium") return "bg-yellow-500 text-black";
  return "bg-green-500 text-white";
};