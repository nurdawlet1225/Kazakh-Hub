// File validation utilities for security

// Maximum file size: 50MB per file
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

// Maximum folder size: 500MB total
export const MAX_FOLDER_SIZE = 500 * 1024 * 1024; // 500MB in bytes

// Dangerous file extensions that should be blocked
export const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.app', '.deb', '.pkg', '.rpm', '.msi', '.dmg', '.sh', '.ps1', '.sh',
  '.bin', '.dll', '.so', '.dylib', '.sys', '.drv', '.ocx', '.cpl',
  '.php', '.asp', '.aspx', '.jsp', '.class',
];

// Allowed file extensions for code files
export const ALLOWED_EXTENSIONS = [
  // Code files
  '.js', '.jsx', '.ts', '.tsx', '.py', '.pyc', '.pyo', '.java', '.cpp', '.c', '.h', '.hpp',
  '.cs', '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala', '.clj',
  '.lua', '.r', '.m', '.pl', '.sh', '.bash', '.zsh', '.fish',
  // Web files
  '.html', '.htm', '.css', '.scss', '.sass', '.less', '.xml', '.json',
  '.yaml', '.yml', '.toml', '.ini', '.conf', '.config',
  // Data files
  '.csv', '.tsv', '.txt', '.md', '.markdown', '.rst', '.tex',
  // Config files
  '.env', '.gitignore', '.dockerfile', '.dockerignore', '.gitattributes',
  '.editorconfig', '.prettierrc', '.eslintrc', '.babelrc',
  // Build files
  '.makefile', '.cmake', '.gradle', '.maven', '.pom', '.build',
  // Documentation
  '.pdf', '.doc', '.docx', '.rtf',
  // No extension (files without extension)
  '',
];

// Allowed MIME types
export const ALLOWED_MIME_TYPES = [
  'text/plain',
  'text/html',
  'text/css',
  'text/javascript',
  'application/javascript',
  'application/json',
  'application/xml',
  'text/xml',
  'text/markdown',
  'text/csv',
  'application/x-sh',
  'application/x-python',
  'text/x-python',
  'text/x-java',
  'text/x-c',
  'text/x-c++',
  'text/x-csharp',
  'application/x-yaml',
  'text/yaml',
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate file extension
 */
export const validateFileExtension = (filename: string): ValidationResult => {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  // Check if extension is in dangerous list
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Қауіпті файл түрі блокталды: ${ext}. Бұл файл түрі жүктелуге рұқсат етілмейді.`,
    };
  }
  
  // If file has extension, check if it's allowed
  if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Рұқсат етілмеген файл түрі: ${ext}. Тек код файлдары жүктелуге рұқсат етіледі.`,
    };
  }
  
  return { valid: true };
};

/**
 * Validate file size
 */
export const validateFileSize = (size: number): ValidationResult => {
  if (size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `Файл өлшемі тым үлкен. Максималды өлшем: ${maxSizeMB}MB. Ағымдағы өлшем: ${(size / (1024 * 1024)).toFixed(2)}MB`,
    };
  }
  
  if (size === 0) {
    return {
      valid: false,
      error: 'Бос файл жүктелуге рұқсат етілмейді.',
    };
  }
  
  return { valid: true };
};

/**
 * Validate file MIME type
 */
export const validateFileMimeType = (file: File): ValidationResult => {
  // If MIME type is not available or is generic, skip validation
  if (!file.type || file.type === 'application/octet-stream') {
    // Fall back to extension validation
    return validateFileExtension(file.name);
  }
  
  // Check if MIME type is allowed
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Рұқсат етілмеген файл түрі: ${file.type}. Тек код файлдары жүктелуге рұқсат етіледі.`,
    };
  }
  
  return { valid: true };
};

/**
 * Validate single file
 */
export const validateFile = (file: File): ValidationResult => {
  // Check file name
  if (!file.name || file.name.trim() === '') {
    return {
      valid: false,
      error: 'Файл атауы бос болмауы керек.',
    };
  }
  
  // Check file extension
  const extResult = validateFileExtension(file.name);
  if (!extResult.valid) {
    return extResult;
  }
  
  // Check file size
  const sizeResult = validateFileSize(file.size);
  if (!sizeResult.valid) {
    return sizeResult;
  }
  
  // Check MIME type
  const mimeResult = validateFileMimeType(file);
  if (!mimeResult.valid) {
    return mimeResult;
  }
  
  return { valid: true };
};

/**
 * Get file extension
 */
export const getFileExtension = (filename: string): string => {
  return filename.toLowerCase().substring(filename.lastIndexOf('.'));
};

/**
 * Check if file is potentially dangerous
 */
export const isDangerousFile = (filename: string): boolean => {
  const ext = getFileExtension(filename);
  return DANGEROUS_EXTENSIONS.includes(ext);
};

