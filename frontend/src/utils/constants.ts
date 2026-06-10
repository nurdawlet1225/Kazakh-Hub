export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api';

// File type labels for display purposes only
// Actual validation is handled by fileValidation.ts using config from the backend
export const FILE_TYPES = {
  JAVASCRIPT: 'javascript',
  TYPESCRIPT: 'typescript',
  PYTHON: 'python',
  JAVA: 'java',
  CPP: 'cpp',
  C: 'c',
  HTML: 'html',
  CSS: 'css',
  JSON: 'json',
  MARKDOWN: 'markdown',
  OTHER: 'other',
} as const;

// These constants are kept for backward compatibility but the actual values
// come from the backend config via SiteConfigContext / fileValidation.ts
export const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB - default, overridden by config
export const SUPPORTED_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h',
  '.html', '.css', '.json', '.md', '.xml', '.yaml', '.yml'
];