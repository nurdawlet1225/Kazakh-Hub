import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCalendar, faHeart, faComment, faEye } from '@fortawesome/free-solid-svg-icons';
import { CodeFile } from '../utils/api';
import './CodeCard.css';

interface CodeCardProps {
  code: CodeFile;
  viewMode?: 'grid' | 'list';
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const CodeCard: React.FC<CodeCardProps> = ({ code, viewMode = 'grid', isSelected = false, onToggleSelect }) => {
  const formatDateNumeric = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const getLanguageColor = (language: string): string => {
    const colors: Record<string, string> = {
      javascript: '#f7df1e',
      typescript: '#3178c6',
      python: '#3776ab',
      java: '#ed8b00',
      cpp: '#00599c',
      c: '#a8b9cc',
      html: '#e34c26',
      css: '#1572b6',
      json: '#000000',
      markdown: '#083fa1',
      other: '#6b7280',
    };
    return colors[language] || colors.other;
  };

  const truncateContent = (content: string, maxLength: number = 150): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Check if content is JSON structure (folder structure data)
  const isJsonStructure = (content: string): boolean => {
    if (!content) return false;
    try {
      const parsed = JSON.parse(content);
      return parsed && typeof parsed === 'object' && 'structure' in parsed;
    } catch {
      // If content starts with JSON-like structure indicators, hide it
      return content.trim().startsWith('{') && content.includes('"structure"');
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSelect?.();
  };


  return (
    <div className={`code-card-wrapper ${viewMode === 'list' ? 'list-mode' : ''} ${isSelected ? 'selected' : ''}`}>
      <Link 
        to={`/view/${code.id}`}
        className={`code-card ${viewMode === 'list' ? 'list-mode' : ''}`}
        onClick={(e) => {
          // If clicking on checkbox, prevent navigation
          if ((e.target as HTMLElement).closest('.code-card-checkbox')) {
            e.preventDefault();
          }
        }}
      >
        {/* Top section: Left (Language + Progress + Description), Center (User), Right (Stats) */}
        <div className="code-card-top-section">
          {/* Left side: Language title, gradient line, and description */}
          <div className="code-card-left-section">
            <h3 className="code-card-language-title">
              {code.isFolder ? code.title : (code.language || 'other').toLowerCase()}
            </h3>
            <div className="code-card-description-row">
              <p className="code-card-description-below">
                {code.description ? (
                  code.description
                ) : !code.isFolder && !isJsonStructure(code.content) ? (
                  truncateContent(code.content, 100)
                ) : (
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontStyle: 'italic' }}>
                    {code.isFolder ? 'Папка ақпараты' : 'Сипаттама жоқ'}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Center: User button */}
          <div className="code-card-author-center">
            <FontAwesomeIcon icon={faUser} />
            <span>{code.author.toUpperCase()}</span>
          </div>

          {/* Right: Stats icons */}
          <div className="code-card-stats-right">
            <span className="code-card-likes"><FontAwesomeIcon icon={faHeart} /> {code.likes?.length || 0}</span>
            <span className="code-card-comments"><FontAwesomeIcon icon={faComment} /> {code.comments?.length || 0}</span>
            <span className="code-card-views"><FontAwesomeIcon icon={faEye} /> {code.views || 0}</span>
          </div>

          {/* Folder stats button - positioned on the right */}
          {code.isFolder && code.folderStructure && (
            <span className="folder-stats-button">
              {Object.keys(code.folderStructure).filter(key => code.folderStructure![key].type === 'file').length} файл
              {Object.keys(code.folderStructure).filter(key => code.folderStructure![key].type === 'folder').length > 0 && 
                `, ${Object.keys(code.folderStructure).filter(key => code.folderStructure![key].type === 'folder').length} папка`}
            </span>
          )}

          {/* Checkbox for files */}
          {onToggleSelect && !code.isFolder && (
            <div className="code-card-checkbox" onClick={handleCheckboxClick}>
              <input
                type="checkbox"
                id={`checkbox-${code.id}`}
                checked={isSelected}
                onChange={() => {}}
                onClick={handleCheckboxClick}
                readOnly
              />
              <label htmlFor={`checkbox-${code.id}`} className="checkbox-label">
                {isSelected && <span className="checkbox-checkmark">✓</span>}
              </label>
            </div>
          )}

          {/* Full width horizontal divider line */}
          <div className="code-card-gradient-line"></div>
        </div>

      </Link>
    </div>
  );
};

export default CodeCard;
