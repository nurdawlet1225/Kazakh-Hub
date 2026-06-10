// File validation utilities for security
// Configuration can be overridden from site config via configureValidation()

import i18n from '../i18n/config';

// Default values (used when config is not loaded yet)
let configMaxFileSize = 30 * 1024 * 1024; // 30MB in bytes
let configMaxFolderSize = 500 * 1024 * 1024; // 500MB in bytes
let configDangerousExtensions: string[] = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.jar',
  '.app', '.deb', '.pkg', '.rpm', '.msi', '.dmg', '.ps1',
  '.bin', '.dll', '.so', '.dylib', '.sys', '.drv', '.ocx', '.cpl',
  '.php', '.asp', '.aspx', '.jsp', '.class',
];
let configAllowedExtensions: string[] = [
  '.js', '.jsx', '.ts', '.tsx', '.py', '.pyc', '.pyo', '.java', '.cpp', '.c', '.h', '.hpp',
  '.cs', '.go', '.rs', '.rb', '.swift', '.kt', '.scala', '.clj',
  '.lua', '.r', '.m', '.pl', '.sh', '.bash', '.zsh', '.fish',
  '.html', '.htm', '.css', '.scss', '.sass', '.less', '.xml', '.json',
  '.yaml', '.yml', '.toml', '.ini', '.conf', '.config',
  '.csv', '.tsv', '.txt', '.md', '.markdown', '.rst', '.tex',
  '.env', '.gitignore', '.dockerfile', '.dockerignore', '.gitattributes',
  '.editorconfig', '.prettierrc', '.eslintrc', '.babelrc',
  '.makefile', '.cmake', '.gradle', '.maven', '.pom', '.build',
  '.pdf', '.doc', '.docx', '.rtf',
  '',
];
let configAllowedMimeTypes: string[] = [
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

/**
 * Configure validation from site config (called by SiteConfigContext)
 */
export const configureValidation = (config: {
  fileConfig?: {
    maxFileSizeBytes?: number;
    maxFileSizeMB?: number;
    maxFolderSizeBytes?: number;
    supportedExtensions?: string[];
    dangerousExtensions?: string[];
    allowedExtensions?: string[];
    allowedMimeTypes?: string[];
  };
}) => {
  if (!config.fileConfig) return;

  if (config.fileConfig.maxFileSizeBytes) {
    configMaxFileSize = config.fileConfig.maxFileSizeBytes;
  } else if (config.fileConfig.maxFileSizeMB) {
    configMaxFileSize = config.fileConfig.maxFileSizeMB * 1024 * 1024;
  }

  if (config.fileConfig.maxFolderSizeBytes) {
    configMaxFolderSize = config.fileConfig.maxFolderSizeBytes;
  }

  if (config.fileConfig.dangerousExtensions?.length) {
    configDangerousExtensions = config.fileConfig.dangerousExtensions;
  }

  if (config.fileConfig.allowedExtensions?.length) {
    configAllowedExtensions = config.fileConfig.allowedExtensions;
  }

  if (config.fileConfig.allowedMimeTypes?.length) {
    configAllowedMimeTypes = config.fileConfig.allowedMimeTypes;
  }
};

// Exported constants for backward compatibility (use configured values)
/** @deprecated These constants are stale — they capture the default value at import time and do not update when configureValidation() is called. Use getConfiguredMaxFileSize() instead. */
export const MAX_FILE_SIZE = 30 * 1024 * 1024; // Default, actual value from config
/** @deprecated These constants are stale — they capture the default value at import time and do not update when configureValidation() is called. Use getConfiguredMaxFolderSize() instead. */
export const MAX_FOLDER_SIZE = 500 * 1024 * 1024; // Default
export const DANGEROUS_EXTENSIONS = configDangerousExtensions;
export const ALLOWED_EXTENSIONS = configAllowedExtensions;
export const ALLOWED_MIME_TYPES = configAllowedMimeTypes;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate file extension
 */
export const validateFileExtension = (filename: string): ValidationResult => {
  const lastDotIndex = filename.lastIndexOf('.');
  const ext = lastDotIndex === -1 ? '' : filename.toLowerCase().substring(lastDotIndex);

  // Check if extension is in dangerous list
  if (configDangerousExtensions.includes(ext)) {
    return {
      valid: false,
      error: i18n.t('uploadModal.dangerousFileType', { ext }),
    };
  }

  // If file has extension, check if it's allowed
  if (ext && !configAllowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: i18n.t('uploadModal.unsupportedFileType', { ext }),
    };
  }

  return { valid: true };
};

/**
 * Validate file size
 */
export const validateFileSize = (size: number): ValidationResult => {
  if (size > configMaxFileSize) {
    const maxSizeMB = configMaxFileSize / (1024 * 1024);
    return {
      valid: false,
      error: i18n.t('uploadModal.fileTooLarge', { maxSize: maxSizeMB.toFixed(0), currentSize: (size / (1024 * 1024)).toFixed(2) }),
    };
  }

  if (size === 0) {
    return {
      valid: false,
      error: i18n.t('uploadModal.emptyFile'),
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
  if (!configAllowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: i18n.t('uploadModal.unsupportedMimeType', { type: file.type }),
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
      error: i18n.t('uploadModal.emptyFileName'),
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
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return filename.toLowerCase().substring(lastDotIndex);
};

/**
 * Check if file is potentially dangerous
 */
export const isDangerousFile = (filename: string): boolean => {
  const ext = getFileExtension(filename);
  return configDangerousExtensions.includes(ext);
};

/**
 * Get configured max file size (for use in components)
 */
export const getConfiguredMaxFileSize = (): number => configMaxFileSize;
export const getConfiguredMaxFolderSize = (): number => configMaxFolderSize;