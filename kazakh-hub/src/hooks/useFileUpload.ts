import { useState, useEffect } from 'react';
import { processFile, processFolder, FileInfo, FolderInfo } from '../utils/fileHandler';
import { apiService } from '../utils/api';
import { offlineStorage, PendingUpload } from '../utils/offlineStorage';
import { v4 as uuidv4 } from 'uuid';

interface UseFileUploadReturn {
  uploading: boolean;
  error: string | null;
  uploadProgress: { current: number; total: number; startTime: number } | null;
  pendingUploads: number;
  isOnline: boolean;
  uploadFile: (file: File, metadata?: { title?: string; description?: string; tags?: string[]; language?: string }) => Promise<void>;
  uploadFolder: (files: FileList, metadata?: { title?: string; description?: string; tags?: string[]; language?: string }) => Promise<void>;
  retryPendingUploads: () => Promise<void>;
  reset: () => void;
}

// Check if online
const isOnline = (): boolean => {
  return navigator.onLine;
};

// Convert FileList to Array for storage
const fileListToArray = (files: FileList | File[]): File[] => {
  if (Array.isArray(files)) return files;
  return Array.from(files);
};

export const useFileUpload = (): UseFileUploadReturn => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; startTime: number } | null>(null);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [isOnlineState, setIsOnlineState] = useState(isOnline());

  // Initialize offline storage
  useEffect(() => {
    offlineStorage.init().catch(console.error);
    checkPendingUploads();
    
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnlineState(true);
      retryPendingUploads();
    };
    const handleOffline = () => {
      setIsOnlineState(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkPendingUploads = async () => {
    try {
      const pending = await offlineStorage.getPendingUploads();
      setPendingUploads(pending.length);
    } catch (err) {
      console.error('Failed to check pending uploads:', err);
    }
  };

  const retryPendingUploads = async () => {
    if (!isOnline()) return;
    
    try {
      const pending = await offlineStorage.getPendingUploads();
      if (pending.length === 0) return;

      console.log(`${pending.length} күтудегі жүктеу табылды, жалғастыру...`);
      
      for (const upload of pending) {
        try {
          if (upload.type === 'folder') {
            // Convert stored files back to FileList-like structure
            const files = fileListToArray(upload.files as File[]);
            const fileList = files as any as FileList;
            await uploadFolder(fileList, upload.metadata);
          } else {
            const file = (upload.files as File[])[0];
            await uploadFile(file, upload.metadata);
          }
          
          // Remove from cache after successful upload
          await offlineStorage.removePendingUpload(upload.id);
          await checkPendingUploads();
        } catch (err) {
          console.error(`Күтудегі жүктеуді жалғастыру қатесі (${upload.id}):`, err);
          // Increment retry count
          upload.retryCount++;
          if (upload.retryCount < 5) {
            await offlineStorage.savePendingUpload(upload);
          } else {
            // Too many retries, remove from cache
            await offlineStorage.removePendingUpload(upload.id);
          }
        }
      }
    } catch (err) {
      console.error('Күтудегі жүктеулерді тексеру қатесі:', err);
    }
  };

  const uploadFile = async (
    file: File,
    metadata?: { title?: string; description?: string; tags?: string[]; language?: string }
  ): Promise<void> => {
    setUploading(true);
    setError(null);
    const startTime = Date.now();
    setUploadProgress({ current: 0, total: 1, startTime });

    try {
      // Step 1: Process file
      setUploadProgress({ current: 0, total: 1, startTime });
      const fileInfo: FileInfo = await processFile(file);
      
      // Step 2: Upload to server
      setUploadProgress({ current: 1, total: 1, startTime });
      
      // Get current user
      const storedUser = localStorage.getItem('user');
      const currentUser = storedUser ? JSON.parse(storedUser) : { username: 'guest' };
      
      await apiService.createCodeFile({
        title: metadata?.title || fileInfo.name,
        content: fileInfo.content,
        language: metadata?.language || fileInfo.language,
        author: currentUser.username || 'guest',
        description: metadata?.description,
        tags: metadata?.tags,
      });
      
      // Dispatch event to refresh codes list
      window.dispatchEvent(new CustomEvent('codesUpdated'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Файлды жүктеу қатесі';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const uploadFolder = async (
    files: FileList,
    metadata?: { title?: string; description?: string; tags?: string[]; language?: string }
  ): Promise<void> => {
    setUploading(true);
    setError(null);
    const startTime = Date.now();
    const uploadId = uuidv4();

    // Check if offline
    if (!isOnline()) {
      try {
        // Save to cache
        const pendingUpload: PendingUpload = {
          id: uploadId,
          type: 'folder',
          files: fileListToArray(files),
          metadata: metadata || {},
          timestamp: Date.now(),
          retryCount: 0,
        };
        await offlineStorage.savePendingUpload(pendingUpload);
        await checkPendingUploads();
        setError('Интернет жоқ. Жүктеу кэштеуге сақталды. Интернет қосылғанда автоматты жалғасады.');
        setUploading(false);
        return;
      } catch (cacheErr) {
        setError('Интернет жоқ және кэштеуге сақтау мүмкін емес.');
        setUploading(false);
        throw cacheErr;
      }
    }

    try {
      if (!files || files.length === 0) {
        throw new Error('Папка бос. Файлдар таңдаңыз.');
      }
      
      console.log('Папка өңделуде...', files.length, 'файл');
      const folderInfo: FolderInfo = await processFolder(files);
      console.log('Папка өңделді:', folderInfo.name, folderInfo.files.length, 'файл');
      
      if (!folderInfo.files || folderInfo.files.length === 0) {
        throw new Error('Папкада өңделуге болатын файлдар жоқ. Тек мәтіндік файлдар қолдайды.');
      }
      
      // Process folder аяқталғаннан кейін прогресс барды бастау
      setUploadProgress({ current: 0, total: folderInfo.files.length, startTime });
      
      // Get current user
      const storedUser = localStorage.getItem('user');
      const currentUser = storedUser ? JSON.parse(storedUser) : { username: 'current-user' };
      
      // Create folder container first
      const folderContent = JSON.stringify({
        structure: folderInfo.structure,
        fileCount: folderInfo.files.length,
        totalSize: folderInfo.totalSize,
      }, null, 2);

      console.log('Папка контейнерін жасауда...');
      const folderCode = await apiService.createCodeFile({
        title: metadata?.title || folderInfo.name,
        content: folderContent,
        language: metadata?.language || 'folder',
        author: currentUser.username || 'current-user',
        description: metadata?.description || `${folderInfo.files.length} файл бар папка`,
        tags: metadata?.tags || ['folder'],
        isFolder: true,
        folderStructure: folderInfo.structure,
      });
      console.log('Папка контейнері жасалды:', folderCode.id);

      // Upload files in batches to avoid overwhelming the server
      const BATCH_SIZE = 10; // Upload 10 files at a time
      const MAX_RETRIES = 3; // Maximum retry attempts per file
      const RETRY_DELAY = 1000; // Delay between retries (ms)
      let successful = 0;
      let failed = 0;
      const totalFiles = folderInfo.files.length;
      const failedFiles: Array<{ fileInfo: FileInfo; filePath: string; retries: number }> = [];
      
      // Retry function with exponential backoff
      const retryUpload = async (
        fileInfo: FileInfo,
        filePath: string,
        fileIndex: number,
        retryCount: number = 0
      ): Promise<any> => {
        try {
          const result = await apiService.createCodeFile({
            title: fileInfo.name,
            content: fileInfo.content,
            language: fileInfo.language,
            author: currentUser.username || 'current-user',
            description: `Файл папкадан: ${metadata?.title || folderInfo.name}`,
            tags: metadata?.tags || ['folder-file'],
            folderId: folderCode.id,
            folderPath: filePath,
          });
          
          // Update progress
          setUploadProgress({ current: fileIndex + 1, total: totalFiles, startTime });
          successful++;
          
          return result;
        } catch (err) {
          if (retryCount < MAX_RETRIES) {
            // Exponential backoff: wait longer with each retry
            const delay = RETRY_DELAY * Math.pow(2, retryCount);
            console.warn(`Файл ${fileInfo.name} жүктелуден өтпеді. ${delay}ms күтуден кейін қайталау (${retryCount + 1}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryUpload(fileInfo, filePath, fileIndex, retryCount + 1);
          } else {
            console.error(`Файл ${fileInfo.name} ${MAX_RETRIES} рет қайталаудан кейін де жүктелуден өтпеді:`, err);
            failed++;
            failedFiles.push({ fileInfo, filePath, retries: retryCount });
            // Still update progress even on error
            setUploadProgress({ current: fileIndex + 1, total: totalFiles, startTime });
            throw err;
          }
        }
      };
      
      // Process files in batches
      for (let i = 0; i < totalFiles; i += BATCH_SIZE) {
        const batch = folderInfo.files.slice(i, i + BATCH_SIZE);
        const batchIndex = i;
        
        // Upload batch of files with retry logic
        const batchPromises = batch.map(async (fileInfo, batchFileIndex) => {
          const fileIndex = batchIndex + batchFileIndex;
          
          // Find the file path in the structure
          const filePath = Object.keys(folderInfo.structure).find(
            path => folderInfo.structure[path].type === 'file' && 
            folderInfo.structure[path].name === fileInfo.name
          ) || fileInfo.name;

          return retryUpload(fileInfo, filePath, fileIndex);
        });

        // Wait for current batch to complete before starting next batch
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Log batch progress
        const batchSuccessful = batchResults.filter(r => r.status === 'fulfilled').length;
        const batchFailed = batchResults.filter(r => r.status === 'rejected').length;
        console.log(`Батч ${Math.floor(i / BATCH_SIZE) + 1}: ${batchSuccessful}/${batch.length} файл сәтті жүктелді${batchFailed > 0 ? `, ${batchFailed} файл сәтсіз` : ''}`);
      }
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`Папка жүктелді: ${successful}/${totalFiles} файл сәтті жүктелді, ${failed} файл сәтсіз (${totalTime} секунд)`);
      
      // Егер барлық файлдар сәтсіз болса, қате көрсету
      if (successful === 0 && totalFiles > 0) {
        throw new Error('Барлық файлдар жүктелуден өтпеді. Сервер қатесін тексеріңіз.');
      }
      
      // Егер кейбір файлдар сәтсіз болса, ескерту көрсету
      if (failed > 0 && successful > 0) {
        const failedFileNames = failedFiles.map(f => f.fileInfo.name).join(', ');
        console.warn(`${failed} файл жүктелуден өтпеді (${MAX_RETRIES} рет қайталаудан кейін): ${failedFileNames}`);
        console.warn(`${successful} файл сәтті жүктелді`);
      }
      
      // Remove from cache if it was a retry
      try {
        await offlineStorage.removePendingUpload(uploadId);
        await checkPendingUploads();
      } catch (cacheErr) {
        // Ignore cache errors
      }
      
      // Dispatch event to refresh codes list
      window.dispatchEvent(new CustomEvent('codesUpdated'));
    } catch (err) {
      console.error('Папка жүктеу қатесі:', err);
      let errorMessage = 'Папканы жүктеу қатесі';
      if (err instanceof Error) {
        errorMessage = err.message;
        console.error('Қате хабарламасы:', errorMessage);
        // Қазақшаға аудару
        if (errorMessage.includes('Something went wrong')) {
          errorMessage = 'Қате орын алды! Сервер қатесі.';
        } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          // If offline, save to cache
          if (!isOnline()) {
            try {
              const pendingUpload: PendingUpload = {
                id: uploadId,
                type: 'folder',
                files: fileListToArray(files),
                metadata: metadata || {},
                timestamp: Date.now(),
                retryCount: 0,
              };
              await offlineStorage.savePendingUpload(pendingUpload);
              await checkPendingUploads();
              errorMessage = 'Интернет үзілді. Жүктеу кэштеуге сақталды. Интернет қосылғанда автоматты жалғасады.';
            } catch (cacheErr) {
              errorMessage = 'Интернет үзілді және кэштеуге сақтау мүмкін емес.';
            }
          } else {
            errorMessage = 'Серверге қосылу мүмкін емес. Backend-тің жұмыс істеп тұрғанын тексеріңіз.';
          }
        } else if (errorMessage.includes('API Error')) {
          errorMessage = 'API қатесі. Сервер жауап бермейді.';
        }
      }
      console.error('Қате хабарламасы (қазақша):', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const reset = () => {
    setError(null);
    setUploading(false);
    setUploadProgress(null);
  };

  return { 
    uploading, 
    error, 
    uploadProgress, 
    pendingUploads,
    isOnline: isOnlineState,
    uploadFile, 
    uploadFolder, 
    retryPendingUploads,
    reset 
  };
};

