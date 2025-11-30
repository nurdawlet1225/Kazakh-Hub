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

  // Second pass: Process files with UI yielding to prevent freezing
  // Optimized for both small and large folders
  const SMALL_FOLDER_THRESHOLD = 10; // For folders with 10 or fewer files
  const FILES_PER_CHUNK = 3; // Process 3 files, then yield to UI (reduced for better responsiveness)
  const YIELD_DELAY = 5; // 5ms delay to allow UI updates (reduced for faster processing)
  
  // Helper function to yield to UI thread using requestIdleCallback if available
  const yieldToUI = (): Promise<void> => {
    return new Promise(resolve => {
      // Use requestIdleCallback if available for better performance
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          setTimeout(resolve, YIELD_DELAY);
        }, { timeout: 10 });
      } else {
        // Fallback to setTimeout
        setTimeout(resolve, YIELD_DELAY);
      }
    });
  };
  
  // For small folders, process files one by one with UI yielding
  if (fileArray.length <= SMALL_FOLDER_THRESHOLD) {
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
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
        
        processedFiles.push(fileInfo);
        totalSize += file.size;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Белгісіз қате';
        console.warn(`Failed to process file ${file.name}:`, errorMsg);
      }
      
      // Yield to UI after each file for small folders
      if (i < fileArray.length - 1) {
        await yieldToUI();
      }
    }
  } else {
    // For larger folders, use chunked processing
    const BATCH_SIZE = 15; // Smaller batch size for better UI responsiveness
    
    // Process files in chunks with UI yielding
    for (let i = 0; i < fileArray.length; i += FILES_PER_CHUNK) {
      const chunk = fileArray.slice(i, i + FILES_PER_CHUNK);
      
      // Process chunk files in parallel
      const chunkPromises = chunk.map(async (file) => {
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
          
          return fileInfo;
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Белгісіз қате';
          console.warn(`Failed to process file ${file.name}:`, errorMsg);
          return null;
        }
      });

      const chunkResults = await Promise.allSettled(chunkPromises);
      chunkResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          processedFiles.push(result.value);
          totalSize += result.value.size;
        }
      });
      
      // Yield to UI after each chunk to prevent freezing
      if (i + FILES_PER_CHUNK < fileArray.length) {
        await yieldToUI();
      }
      
      // Log progress for large folders
      if (fileArray.length > 50 && (i + FILES_PER_CHUNK) % 30 === 0) {
        const processedCount = Math.min(i + FILES_PER_CHUNK, fileArray.length);
        console.log(`Өңделуде: ${processedCount}/${fileArray.length} файл`);
      }
    }
  }

  return {
    name: folderName,
    files: processedFiles,
    totalSize,
    structure,
  };
};