import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder } from '@fortawesome/free-solid-svg-icons';
import { useFileUpload } from '../hooks/useFileUpload';
import './UploadModal.css';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { uploading, error, uploadProgress, uploadFolder, reset } = useFileUpload();

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(e.dataTransfer.files);
      const folderName = e.dataTransfer.files[0]?.webkitRelativePath?.split('/')[0] || 'folder';
      if (!title) {
        setTitle(folderName);
      }
    }
  };

  const handleFolderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
      const folderName = e.target.files[0]?.webkitRelativePath?.split('/')[0] || 'folder';
      if (!title) {
        setTitle(folderName);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles) return;
    
    // Тіл міндетті
    if (!language) {
      alert(t('settings.selectLanguage'));
      return;
    }
    
    // Папка үшін проект сипаттамасы міндетті
    if (!projectDescription.trim()) {
      alert(t('settings.enterProjectDescription'));
      return;
    }

    try {
      await uploadFolder(selectedFiles, {
        title: title || 'folder',
        description: projectDescription || undefined,
        language: language,
      });
      onSuccess?.();
      handleClose();
    } catch (err) {
      // Error is handled by the hook
      console.error('Папка жүктеу қатесі:', err);
      // Don't close modal on error so user can see the error message
    }
  };

  const handleClose = () => {
    setSelectedFiles(null);
    setTitle('');
    setLanguage('');
    setProjectDescription('');
    reset();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('settings.uploadCode')}</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          <div
            className={`upload-dropzone ${dragActive ? 'active' : ''} ${selectedFiles ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => {
              folderInputRef.current?.click();
            }}
          >
            <input
              ref={folderInputRef}
              type="file"
              onChange={handleFolderInput}
              {...({ webkitdirectory: '', directory: '', multiple: true } as any)}
              style={{ display: 'none' }}
            />
            {selectedFiles ? (
              <div className="file-selected">
                <span className="file-icon"><FontAwesomeIcon icon={faFolder} /></span>
                <span className="file-name">
                  {selectedFiles[0]?.webkitRelativePath?.split('/')[0] || t('settings.folder')}
                </span>
                <span className="file-size">{selectedFiles.length} {t('settings.files')}</span>
              </div>
            ) : (
              <div className="dropzone-content">
                <span className="dropzone-icon"><FontAwesomeIcon icon={faFolder} /></span>
                <p>{t('settings.dragFolderHere')}</p>
                <p className="dropzone-hint">{t('settings.allFilesProcessed')}</p>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="title">{t('settings.title')}</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('settings.enterCodeTitle')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="language">{t('settings.languageRequired')} <span className="required">*</span></label>
            <input
              id="language"
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder={t('settings.languagePlaceholder')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="projectDescription">{t('settings.projectDescription')} <span className="required">*</span></label>
            <textarea
              id="projectDescription"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder={t('settings.projectDescriptionPlaceholder')}
              rows={4}
              required
            />
          </div>

          {uploadProgress && uploadProgress.total > 0 && (
            <div className="upload-progress">
              <div className="progress-info">
                <span>
                  {`${t('settings.uploadingProgress')}: ${uploadProgress.current} / ${uploadProgress.total} ${t('settings.filesProgress')}`}
                </span>
                <span className="progress-time">
                  {(() => {
                    const elapsed = ((Date.now() - uploadProgress.startTime) / 1000).toFixed(1);
                    const percentage = uploadProgress.total > 0 
                      ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
                      : 0;
                    const remaining = uploadProgress.current > 0 && uploadProgress.total > uploadProgress.current
                      ? ((Date.now() - uploadProgress.startTime) / uploadProgress.current * (uploadProgress.total - uploadProgress.current) / 1000).toFixed(1)
                      : '0';
                    return `${t('settings.elapsed')}: ${elapsed}с${uploadProgress.total > uploadProgress.current ? ` | ${t('settings.remaining')}: ~${remaining}с` : ''} | ${percentage}%`;
                  })()}
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          )}

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={handleClose} className="btn-secondary">
              Болдырмау
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={!selectedFiles || !language || !projectDescription.trim() || uploading}
            >
              {uploading ? t('settings.uploading') : t('settings.upload')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;

