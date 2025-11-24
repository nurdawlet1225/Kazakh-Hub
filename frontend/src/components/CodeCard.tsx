import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faUser, faCalendar, faHeart, faComment, faEye } from '@fortawesome/free-solid-svg-icons';
import { CodeFile } from '../utils/api';
import { formatDate } from '../utils/dateFormatter';
import './CodeCard.css';

interface CodeCardProps {
  code: CodeFile;
  viewMode?: 'grid' | 'list';
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const CodeCard: React.FC<CodeCardProps> = ({ code, viewMode = 'grid', isSelected = false, onToggleSelect }) => {
  const { i18n } = useTranslation();

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
        <div className="code-card-header">
          <h3 className="code-card-title">{code.title}</h3>
          <div className="code-card-header-right">
            <span
              className="code-card-language"
              style={{ 
                backgroundColor: code.isFolder 
                  ? getLanguageColor('other') + '20' 
                  : getLanguageColor(code.language?.toLowerCase() || 'other') + '20', 
                color: code.isFolder 
                  ? getLanguageColor('other') 
                  : getLanguageColor(code.language?.toLowerCase() || 'other') 
              }}
            >
              {code.isFolder ? <><FontAwesomeIcon icon={faFolder} /> Папка</> : (code.language || 'other').charAt(0).toUpperCase() + (code.language || 'other').slice(1)}
            </span>
            {/* Файл үшін checkbox header-да */}
            {onToggleSelect && !code.isFolder && (
              <div className="code-card-checkbox" onClick={handleCheckboxClick}>
                <input
                  type="checkbox"
                  id={`checkbox-${code.id}`}
                  checked={isSelected}
                  onChange={() => {}} // Controlled by parent
                  onClick={handleCheckboxClick}
                  readOnly
                />
                <label htmlFor={`checkbox-${code.id}`} className="checkbox-label">
                  {isSelected && <span className="checkbox-checkmark">✓</span>}
                </label>
              </div>
            )}
          </div>
        </div>

      {code.description && (
        <p className="code-card-description">{code.description}</p>
      )}

      {!code.isFolder && !isJsonStructure(code.content) && (
        <div className="code-card-content">
          <pre className="code-preview">
            <code>{truncateContent(code.content)}</code>
          </pre>
        </div>
      )}

      <div className="code-card-footer">
        <div className="code-card-meta">
          <span className="code-card-author"><FontAwesomeIcon icon={faUser} /> {code.author}</span>
          <span className="code-card-date"><FontAwesomeIcon icon={faCalendar} /> {formatDate(code.createdAt, i18n.language)}</span>
          {code.likes && code.likes.length > 0 && (
            <span className="code-card-likes"><FontAwesomeIcon icon={faHeart} /> {code.likes.length}</span>
          )}
          {code.comments && code.comments.length > 0 && (
            <span className="code-card-comments"><FontAwesomeIcon icon={faComment} /> {code.comments.length}</span>
          )}
          {code.isFolder && (
            <span className="code-card-views"><FontAwesomeIcon icon={faEye} /> {code.views || 0}</span>
          )}
        </div>
        <div className="code-card-footer-right">
          {code.tags && code.tags.length > 0 && (
            <div className="code-card-tags">
              {code.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
          )}
          {/* Папка үшін checkbox footer-да */}
          {onToggleSelect && code.isFolder && (
            <div className="code-card-checkbox code-card-checkbox-footer" onClick={handleCheckboxClick}>
              <input
                type="checkbox"
                id={`checkbox-${code.id}`}
                checked={isSelected}
                onChange={() => {}} // Controlled by parent
                onClick={handleCheckboxClick}
                readOnly
              />
              <label htmlFor={`checkbox-${code.id}`} className="checkbox-label">
                {isSelected && <span className="checkbox-checkmark">✓</span>}
              </label>
            </div>
          )}
        </div>
      </div>
      </Link>
    </div>
  );
};

export default CodeCard;

