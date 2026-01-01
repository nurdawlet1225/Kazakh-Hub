import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faTerminal } from '@fortawesome/free-solid-svg-icons';
import { useFileUpload } from '../hooks/useFileUpload';
import Button from './Button';
import WebTerminal from './WebTerminal';
import './UploadModal.css';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type UploadMode = 'folder' | 'terminal';

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [uploadMode, setUploadMode] = useState<UploadMode>('folder');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const folderInputRef = useRef<HTMLInputElement>(null);
  const terminalCommandRef = useRef<HTMLInputElement>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
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
    setUploadMode('folder');
    reset();
    onClose();
  };

  const handleCopyCommand = () => {
    if (terminalCommandRef.current) {
      terminalCommandRef.current.select();
      document.execCommand('copy');
      // Show feedback
      const originalValue = terminalCommandRef.current.value;
      terminalCommandRef.current.value = 'Команда көшірілді!';
      setTimeout(() => {
        if (terminalCommandRef.current) {
          terminalCommandRef.current.value = originalValue;
        }
      }, 1000);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('settings.uploadCode')}</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          {/* Режим таңдау баттамалары */}
          <div className="upload-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${uploadMode === 'folder' ? 'active' : ''}`}
              onClick={() => setUploadMode('folder')}
            >
              <FontAwesomeIcon icon={faFolder} style={{ marginRight: '0.5rem' }} />
              Папка/Файл
            </button>
            <button
              type="button"
              className={`mode-btn ${uploadMode === 'terminal' ? 'active' : ''}`}
              onClick={() => setUploadMode('terminal')}
            >
              <FontAwesomeIcon icon={faTerminal} style={{ marginRight: '0.5rem' }} />
              Терминал
            </button>
          </div>

          {/* Папка/Файл режимі */}
          {uploadMode === 'folder' && (
            <>
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
          </>
          )}

          {/* Терминал режимі */}
          {uploadMode === 'terminal' && (
            <div className="terminal-upload-section">
              <div className="terminal-instructions">
                <h3>Терминал арқылы код жүктеу</h3>
                <p>Терминалды іске қосып, төмендегі команданы орындаңыз:</p>
              </div>
              
              <div className="terminal-start-section">
                <div className="terminal-launch-box">
                  <p className="terminal-launch-title">💻 Веб-терминалды ашу:</p>
                  <p className="terminal-launch-description">
                    Терминалды браузерде ашу үшін төмендегі баттаманы басыңыз
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsTerminalOpen(true)}
                    className="launch-terminal-btn"
                  >
                    <FontAwesomeIcon icon={faTerminal} style={{ marginRight: '0.5rem' }} />
                    Терминалды ашу
                  </button>
                </div>
                
                <p className="terminal-start-title"><strong>Немесе терминалды іске қосу:</strong></p>
                <div className="terminal-start-commands">
                  <div className="terminal-start-option">
                    <p className="option-label">Windows (Command Prompt):</p>
                    <div className="terminal-command-box">
                      <input
                        type="text"
                        readOnly
                        value='cd "C:\Users\nurda\code\Kazakh Hub\nairee_cli" && run.bat'
                        className="terminal-command-input"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.value = 'cd "C:\\Users\\nurda\\code\\Kazakh Hub\\nairee_cli" && run.bat';
                          document.body.appendChild(input);
                          input.select();
                          document.execCommand('copy');
                          document.body.removeChild(input);
                          alert('Команда көшірілді!');
                        }}
                        className="copy-command-btn"
                      >
                        Көшіру
                      </button>
                    </div>
                  </div>
                  <div className="terminal-start-option">
                    <p className="option-label">Windows (PowerShell):</p>
                    <div className="terminal-command-box">
                      <input
                        type="text"
                        readOnly
                        value='cd "C:\Users\nurda\code\Kazakh Hub\nairee_cli"; .\run.ps1'
                        className="terminal-command-input"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.value = 'cd "C:\\Users\\nurda\\code\\Kazakh Hub\\nairee_cli"; .\\run.ps1';
                          document.body.appendChild(input);
                          input.select();
                          document.execCommand('copy');
                          document.body.removeChild(input);
                          alert('Команда көшірілді!');
                        }}
                        className="copy-command-btn"
                      >
                        Көшіру
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="terminal-command-section">
                <p className="terminal-start-title"><strong>2. Код жүктеу командасы:</strong></p>
                <div className="terminal-command-box">
                  <input
                    ref={terminalCommandRef}
                    type="text"
                    readOnly
                    value='upload <file_path> --author "<author_name>" [options]'
                    className="terminal-command-input"
                  />
                  <button
                    type="button"
                    onClick={handleCopyCommand}
                    className="copy-command-btn"
                  >
                    Көшіру
                  </button>
                </div>
              </div>

              <div className="terminal-examples">
                <p className="terminal-examples-title">Мысалдар:</p>
                <div className="terminal-example">
                  <code>upload main.cpp --author "John Doe" --title "My C++ Program"</code>
                </div>
                <div className="terminal-example">
                  <code>upload app.py --author "Jane Smith" --language "Python"</code>
                </div>
                <div className="terminal-example">
                  <code>upload index.html --author "Bob" --title "Homepage"</code>
                </div>
              </div>
              <div className="terminal-requirements">
                <p><strong>Қажетті талаптар:</strong></p>
                <ul>
                  <li>Терминал <code>nairee_cli</code> папкасында орналасқан</li>
                  <li>Backend сервері <code>http://127.0.0.1:3000</code> адресінде жұмыс істеуі керек</li>
                  <li><code>curl</code> құралы жүйеде орнатылған болуы керек</li>
                  <li>C++ компилятор (CMake, g++ немесе cl) құрастыру үшін қажет</li>
                </ul>
              </div>
            </div>
          )}

          {/* Форма өрістері (тек папка режимінде) */}
          {uploadMode === 'folder' && (
            <>
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
              rows={3}
              required
            />
          </div>

          {uploadMode === 'folder' && uploadProgress && uploadProgress.total > 0 && (
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

          {uploadMode === 'folder' && error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="form-actions">
            <Button type="button" onClick={handleClose} variant="secondary">
              Болдырмау
            </Button>
            {uploadMode === 'folder' && (
              <Button 
                type="submit" 
                variant="primary" 
                disabled={!selectedFiles || !language || !projectDescription.trim() || uploading}
              >
                {uploading ? t('settings.uploading') : t('settings.upload')}
              </Button>
            )}
            {uploadMode === 'terminal' && (
              <Button 
                type="button" 
                variant="primary" 
                onClick={handleClose}
              >
                Түсіндім
              </Button>
            )}
          </div>
          </>
          )}
        </form>
      </div>
      <WebTerminal isOpen={isTerminalOpen} onClose={() => setIsTerminalOpen(false)} />
    </div>
  );
};

export default UploadModal;

