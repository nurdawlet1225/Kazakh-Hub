import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder } from '@fortawesome/free-solid-svg-icons';
import { useFileUpload } from '../hooks/useFileUpload';
import Button from './ui/Button';
import './FolderUploadItem.css';

interface FolderUploadItemProps {
  onSuccess?: () => void;
}

const FolderUploadItem: React.FC<FolderUploadItemProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { uploading, error, uploadFolder, reset } = useFileUpload();

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
      setSelectedFiles(Array.from(e.dataTransfer.files));
      const folderName = e.dataTransfer.files[0]?.webkitRelativePath?.split('/')[0] || 'folder';
      if (!title) {
        setTitle(folderName);
      }
    }
  };

  const handleFolderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
      const folderName = e.target.files[0]?.webkitRelativePath?.split('/')[0] || 'folder';
      if (!title) {
        setTitle(folderName);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) return;

    try {
      await uploadFolder(selectedFiles, {
        title: title || 'folder',
        description: description || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
      });
      handleReset();
      onSuccess?.();
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setTitle('');
    setDescription('');
    setTags('');
    reset();
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  return (
    <div className="folder-upload-item">
      <div className="folder-upload-header">
        <h3><FontAwesomeIcon icon={faFolder} /> {t('folderUpload.title')}</h3>
      </div>

      <form onSubmit={handleSubmit} className="folder-upload-form">
        <div
          className={`folder-upload-dropzone ${dragActive ? 'active' : ''} ${selectedFiles ? 'has-files' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => folderInputRef.current?.click()}
        >
          <input
            ref={folderInputRef}
            type="file"
            onChange={handleFolderInput}
            {...({ webkitdirectory: '', directory: '', multiple: true } as any)}
            style={{ display: 'none' }}
          />
          {selectedFiles ? (
            <div className="folder-selected">
              <span className="folder-icon"><FontAwesomeIcon icon={faFolder} /></span>
              <span className="folder-name">
                {selectedFiles[0]?.webkitRelativePath?.split('/')[0] || t('folderUpload.folderLabel')}
              </span>
              <span className="folder-size">{selectedFiles.length} {t('folderUpload.fileCount')}</span>
            </div>
          ) : (
            <div className="dropzone-content">
              <span className="dropzone-icon"><FontAwesomeIcon icon={faFolder} /></span>
              <p>{t('folderUpload.dropzoneText')}</p>
              <p className="dropzone-hint">{t('folderUpload.dropzoneHint')}</p>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="folder-title">{t('folderUpload.titleLabel')}</label>
          <input
            id="folder-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('folderUpload.titlePlaceholder')}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="folder-description">{t('folderUpload.descriptionLabel')}</label>
          <textarea
            id="folder-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('folderUpload.descriptionPlaceholder')}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="folder-tags">{t('folderUpload.tagsLabel')}</label>
          <input
            id="folder-tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={t('folderUpload.tagsPlaceholder')}
          />
        </div>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="form-actions">
          <Button type="button" onClick={handleReset} variant="secondary">
            {t('folderUpload.clear')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!selectedFiles || uploading}
          >
            {uploading ? t('folderUpload.uploading') : t('folderUpload.upload')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FolderUploadItem;