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

export interface UserPreferences {
  selectorType: "data-testid" | "id" | "class" | "text";
  quoteStyle: "single" | "double";
  assertionStyle: "should" | "expect";
}

export type ThemeMode = "dark" | "light";