import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScroll, faBook, faCog, faGlobe, faPalette, faFile, faFolder, faFolderOpen, faFileCode, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { CodeFile } from '../utils/api';
import './FileExplorer.css';

interface FileExplorerProps {
  files: CodeFile[];
  onFileSelect?: (file: CodeFile) => void;
  selectedFileId?: string;
  showFolderStructure?: boolean; // If true, show folder structure instead of grouping by language
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  onFileSelect,
  selectedFileId,
  showFolderStructure = false,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder);
    } else {
      newExpanded.add(folder);
    }
    setExpandedFolders(newExpanded);
  };

  const groupByLanguage = (files: CodeFile[]): Record<string, CodeFile[]> => {
    return files.reduce((acc, file) => {
      const lang = file.language || 'other';
      if (!acc[lang]) {
        acc[lang] = [];
      }
      acc[lang].push(file);
      return acc;
    }, {} as Record<string, CodeFile[]>);
  };

  const groupByFolderPath = (files: CodeFile[]): Record<string, CodeFile[]> => {
    const grouped: Record<string, CodeFile[]> = {};
    
    files.forEach(file => {
      const path = file.folderPath || file.title;
      const pathParts = path.split('/');
      const folder = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : 'root';
      
      if (!grouped[folder]) {
        grouped[folder] = [];
      }
      grouped[folder].push(file);
    });
    
    return grouped;
  };

  const groupedFiles = showFolderStructure ? groupByFolderPath(files) : groupByLanguage(files);

  const getLanguageIcon = (language: string): JSX.Element => {
    const icons: Record<string, JSX.Element> = {
      javascript: <FontAwesomeIcon icon={faScroll} />,
      typescript: <FontAwesomeIcon icon={faBook} />,
      python: <FontAwesomeIcon icon={faFileCode} />,
      java: <FontAwesomeIcon icon={faFileCode} />,
      cpp: <FontAwesomeIcon icon={faCog} />,
      c: <FontAwesomeIcon icon={faCog} />,
      html: <FontAwesomeIcon icon={faGlobe} />,
      css: <FontAwesomeIcon icon={faPalette} />,
      json: <FontAwesomeIcon icon={faFileAlt} />,
      markdown: <FontAwesomeIcon icon={faFileAlt} />,
      other: <FontAwesomeIcon icon={faFile} />,
    };
    return icons[language] || icons.other;
  };

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <h3>Файлдар</h3>
        <span className="file-count">{files.length} файл</span>
      </div>

      <div className="file-explorer-content">
        {Object.keys(groupedFiles).length === 0 ? (
          <div className="file-explorer-empty">
            <p>Әлі файлдар жоқ</p>
            <p className="empty-hint">Бастау үшін алғашқы файлыңызды жүктеңіз</p>
          </div>
        ) : (
          Object.entries(groupedFiles).map(([language, langFiles]) => (
            <div key={language} className="file-folder">
              <div
                className="file-folder-header"
                onClick={() => toggleFolder(language)}
              >
                <span className="folder-icon">
                  {expandedFolders.has(language) ? <FontAwesomeIcon icon={faFolderOpen} /> : <FontAwesomeIcon icon={faFolder} />}
                </span>
                <span className="folder-name">{language}</span>
                <span className="folder-count">{langFiles.length}</span>
              </div>

              {expandedFolders.has(language) && (
                <div className="file-folder-content">
                  {langFiles.map((file) => {
                    const displayName = showFolderStructure && file.folderPath 
                      ? file.folderPath.split('/').pop() || file.title
                      : file.title;
                    return (
                      <div
                        key={file.id}
                        className={`file-item ${selectedFileId === file.id ? 'selected' : ''}`}
                        onClick={() => onFileSelect?.(file)}
                      >
                        <span className="file-icon">{getLanguageIcon(file.language)}</span>
                        <span className="file-name" title={file.folderPath || file.title}>
                          {displayName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileExplorer;

