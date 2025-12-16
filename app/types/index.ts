export interface GeneratedFile {
  path: string;
  content: string;
}

export interface LintItem {
  id: number;
  severity: "Error" | "Warning" | "Good";
  file: string;
  message: string;
}

export interface RiskAnalysis {
  score: number;
  priority: string;
  reasoning: string;
}

export interface ResultData {
  risk_analysis: RiskAnalysis;
  generated_files: GeneratedFile[];
  lint_report: LintItem[];
}

export type ThemeMode = "dark" | "light";