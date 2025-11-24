export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

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

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const SUPPORTED_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h',
  '.html', '.css', '.json', '.md', '.xml', '.yaml', '.yml'
];