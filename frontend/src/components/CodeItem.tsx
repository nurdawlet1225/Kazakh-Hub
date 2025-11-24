import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCalendar, faHeart, faComment } from '@fortawesome/free-solid-svg-icons';
import { CodeFile } from '../utils/api';
import { formatDate } from '../utils/dateFormatter';
import './CodeItem.css';

interface CodeItemProps {
  code: CodeFile;
  viewMode?: 'grid' | 'list';
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const CodeItem: React.FC<CodeItemProps> = ({ code, viewMode = 'grid', isSelected = false, onToggleSelect }) => {
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
    <div className={`code-item-wrapper ${viewMode === 'list' ? 'list-mode' : ''} ${isSelected ? 'selected' : ''}`}>
      <Link 
        to={`/view/${code.id}`}
        className={`code-item ${viewMode === 'list' ? 'list-mode' : ''}`}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('.code-item-checkbox')) {
            e.preventDefault();
          }
        }}
      >
        <div className="code-item-header">
          <h3 className="code-item-title">{code.title}</h3>
          <div className="code-item-header-right">
            <span
              className="code-item-language"
              style={{ 
                backgroundColor: getLanguageColor(code.language) + '20', 
                color: getLanguageColor(code.language) 
              }}
            >
              {code.language}
            </span>
            {onToggleSelect && (
              <div className="code-item-checkbox" onClick={handleCheckboxClick}>
                <input
                  type="checkbox"
                  id={`code-checkbox-${code.id}`}
                  checked={isSelected}
                  onChange={() => {}}
                  onClick={handleCheckboxClick}
                  readOnly
                />
                <label htmlFor={`code-checkbox-${code.id}`} className="checkbox-label">
                  {isSelected && <span className="checkbox-checkmark">✓</span>}
                </label>
              </div>
            )}
          </div>
        </div>

        {code.description && (
          <p className="code-item-description">{code.description}</p>
        )}

        {!code.isFolder && !isJsonStructure(code.content) && (
          <div className="code-item-content">
            <pre className="code-preview">
              <code>{truncateContent(code.content)}</code>
            </pre>
          </div>
        )}

        <div className="code-item-footer">
          <div className="code-item-meta">
            <span className="code-item-author"><FontAwesomeIcon icon={faUser} /> {code.author}</span>
            <span className="code-item-date"><FontAwesomeIcon icon={faCalendar} /> {formatDate(code.createdAt, i18n.language)}</span>
            {code.likes && code.likes.length > 0 && (
              <span className="code-item-likes"><FontAwesomeIcon icon={faHeart} /> {code.likes.length}</span>
            )}
            {code.comments && code.comments.length > 0 && (
              <span className="code-item-comments"><FontAwesomeIcon icon={faComment} /> {code.comments.length}</span>
            )}
          </div>
          <div className="code-item-footer-right">
            {code.tags && code.tags.length > 0 && (
              <div className="code-item-tags">
                {code.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CodeItem;

