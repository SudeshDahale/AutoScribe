export interface User {
  username: string;
  avatar_url: string;
  user_id: number;
  access_token: string;
}

export interface Repo {
  id: number;
  full_name: string;
  repo_name: string;
  github_url: string;
  description: string;
  default_branch: string;
  stars: number;
  language: string;
  last_pushed_at: string;
  created_at: string;
}

export interface Symbol {
  type: string;
  name: string;
  line: number;
  docstring: string;
}

export interface ParsedFile {
  file_path: string;
  language: string;
  symbols: Symbol[];
}

export interface Docstring {
  name: string;
  type: string;
  docstring: string;
}

export interface SearchResult {
  name: string;
  type: string;
  file_path: string;
  language: string;
  line: number;
  docstring: string;
  score: number;
}

export interface IndexStats {
  indexed: boolean;
  symbol_count: number;
}

export interface StalenessReport {
  stale_files_count: number;
  stale_files: { file_path: string; status: string; reason: string }[];
  status: string;
  breakdown: { new: number; modified: number; deleted: number };
  last_documented_at: string | null;
}

export interface Analytics {
  total_files: number;
  total_symbols: number;
  documented_symbols: number;
  coverage_pct: number;
  has_readme: boolean;
  docstring_files_count: number;
  stale_count: number;
  stale_breakdown: { new: number; modified: number; deleted: number };
  last_documented_at: string | null;
  status: string;
}

export interface RepoHealth {
  repoId: number;
  coverage_pct: number | null;
  stale_count: number | null;
  status: string | null;
  loading: boolean;
}

export interface WebhookStatus {
  configured: boolean;
  enabled?: boolean;
  auto_regenerate?: boolean;
  last_triggered_at?: string | null;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  doc_type: string;
  prompt: string;
  variables: string[];
  category: string;
}

export interface EditHistoryEntry {
  prompt: string;
  content_preview: string;
  generated_at: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
  character_count: number;
  estimated_tokens: number;
}

export type RightPanel = "empty" | "parse" | "readme" | "docstrings" | "search" | "staleness" | "analytics" | "webhook";