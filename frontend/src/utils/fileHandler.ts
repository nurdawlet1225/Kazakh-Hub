import { FILE_TYPES, SUPPORTED_EXTENSIONS } from './constants';

export interface FileInfo {
  name: string;
  content: string;
  language: string;
  size: number;
}

export interface FolderInfo {
  name: string;
  files: FileInfo[];
  totalSize: number;
  structure: FolderStructure;
}

export interface FolderStructure {
  [path: string]: {
    type: 'file' | 'folder';
    name: string;
    size?: number;
    language?: string;
  };
}

export const isImageFile = (filename: string): boolean => {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico'];
  return imageExtensions.includes(ext);
};

export const detectLanguage = (filename: string): string => {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  const languageMap: Record<string, string> = {
    '.js': FILE_TYPES.JAVASCRIPT,
    '.jsx': FILE_TYPES.JAVASCRIPT,
    '.ts': FILE_TYPES.TYPESCRIPT,
    '.tsx': FILE_TYPES.TYPESCRIPT,
    '.py': FILE_TYPES.PYTHON,
    '.java': FILE_TYPES.JAVA,
    '.cpp': FILE_TYPES.CPP,
    '.c': FILE_TYPES.C,
    '.h': FILE_TYPES.C,
    '.html': FILE_TYPES.HTML,
    '.css': FILE_TYPES.CSS,
    '.json': FILE_TYPES.JSON,
    '.md': FILE_TYPES.MARKDOWN,
  };

  return languageMap[ext] || FILE_TYPES.OTHER;
};

export const isSupportedFile = (filename: string): boolean => {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return SUPPORTED_EXTENSIONS.includes(ext);
};

export const readFileContent = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // For image files, read as data URL (base64)
    if (isImageFile(file.name)) {
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result); // Returns data:image/...;base64,... format
        } else {
          reject(new Error(`Кескінді оқу мүмкін емес: ${file.name}`));
        }
      };
      reader.onerror = () => {
        reject(new Error(`Кескінді оқу қатесі: ${file.name}`));
      };
      try {
        reader.readAsDataURL(file);
      } catch (err) {
        reject(new Error(`Кескінді оқу мүмкін емес: ${file.name}`));
      }
    } else {
      // For text files, read as text
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error(`Файлды оқу мүмкін емес: ${file.name} (мәтіндік емес файл)`));
        }
      };
      reader.onerror = () => {
        reject(new Error(`Файлды оқу қатесі: ${file.name}`));
      };
      try {
        reader.readAsText(file, 'UTF-8');
      } catch (err) {
        reject(new Error(`Файлды оқу мүмкін емес: ${file.name}`));
      }
    }
  });
};

export const processFile = async (file: File): Promise<FileInfo> => {
  const content = await readFileContent(file);
  const language = detectLanguage(file.name);

  return {
    name: file.name,
    content,
    language,
    size: file.size,
  };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const processFolder = async (files: FileList): Promise<FolderInfo> => {
  const fileArray = Array.from(files);
  const folderName = fileArray[0]?.webkitRelativePath?.split('/')[0] || 'folder';
  const structure: FolderStructure = {};
  const processedFiles: FileInfo[] = [];
  let totalSize = 0;

  // First pass: Build folder structure (fast, no file reading)
  for (const file of fileArray) {
    const path = file.webkitRelativePath || file.name;
    const pathParts = path.split('/');
    
    // Build folder structure
    let currentPath = '';
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!structure[currentPath]) {
        structure[currentPath] = {
          type: 'folder',
          name: part,
        };
      }
    }

    // Add file to structure (without content yet)
    structure[path] = {
      type: 'file',
      name: file.name,
      size: file.size,
      language: 'other', // Will be updated when processed
    };
  }

  // Second pass: Process files in batches to avoid memory issues
  const BATCH_SIZE = 50; // Process 50 files at a time
  for (let i = 0; i < fileArray.length; i += BATCH_SIZE) {
    const batch = fileArray.slice(i, i + BATCH_SIZE);
    
    const batchPromises = batch.map(async (file) => {
      const path = file.webkitRelativePath || file.name;
    try {
      const content = await readFileContent(file);
      const language = detectLanguage(file.name);
      const fileInfo: FileInfo = {
        name: file.name,
        content,
        language,
        size: file.size,
      };
        
        // Update structure with language
        if (structure[path]) {
          structure[path].language = language;
        }
        
      totalSize += file.size;
        return fileInfo;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Белгісіз қате';
      console.warn(`Failed to process file ${file.name}:`, errorMsg);
        // File already in structure, just mark as failed
        return null;
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        processedFiles.push(result.value);
      }
    });
    
    // Log progress for large folders
    if (fileArray.length > 100) {
      console.log(`Өңделуде: ${Math.min(i + BATCH_SIZE, fileArray.length)}/${fileArray.length} файл`);
    }
  }

  return {
    name: folderName,
    files: processedFiles,
    totalSize,
    structure,
  };
};