import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCalendar, faHeart, faComment, faEye } from '@fortawesome/free-solid-svg-icons';
import { CodeFile } from '../utils/api';

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
    <div className={`relative z-0 w-full h-full overflow-visible max-w-none p-2 box-border group ${isSelected ? 'selected' : ''}`}>
      <Link 
        to={`/view/${code.id}`}
        className={`flex bg-bg-secondary border-[1.5px] border-border rounded-2xl p-[calc(1.5rem-2px)] no-underline text-inherit transition-all cursor-pointer w-full min-h-[120px] flex-row gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.25),0_2px_4px_rgba(0,0,0,0.15)] relative overflow-hidden z-[1] backdrop-blur-[10px] backdrop-saturate-[180%] box-border hover:bg-gradient-to-br hover:from-[rgba(0,175,202,0.3)] hover:to-[rgba(0,153,204,0.25)] ${
          isSelected 
            ? 'border-primary shadow-[0_0_0_2px_rgba(0,175,202,0.5),0_8px_24px_rgba(0,175,202,0.6)] bg-gradient-to-br from-[rgba(0,175,202,0.2)] to-[rgba(0,153,204,0.15)]' 
            : ''
        }`}
        onClick={(e) => {
          // If clicking on checkbox, prevent navigation
          if ((e.target as HTMLElement).closest('[data-checkbox]')) {
            e.preventDefault();
          }
        }}
      >
        <div className="flex flex-col justify-start items-start gap-2 flex-1 min-w-0">
          <h3 className="text-xl font-extrabold text-text-primary m-0 flex-1 leading-tight tracking-[-0.02em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">{code.title}</h3>
          <div className="flex items-center gap-3">
            {!code.isFolder && (
              <span
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-all"
                style={{ 
                  backgroundColor: getLanguageColor(code.language?.toLowerCase() || 'other') + '20', 
                  color: getLanguageColor(code.language?.toLowerCase() || 'other') 
                }}
              >
                {(code.language || 'other').charAt(0).toUpperCase() + (code.language || 'other').slice(1)}
              </span>
            )}
            {/* Файл үшін checkbox header-да */}
            {onToggleSelect && !code.isFolder && (
              <div className="flex-shrink-0 z-[3] relative pointer-events-auto flex items-center justify-center" data-checkbox onClick={handleCheckboxClick}>
                <input
                  type="checkbox"
                  id={`checkbox-${code.id}`}
                  checked={isSelected}
                  onChange={() => {}}
                  onClick={handleCheckboxClick}
                  readOnly
                  className="absolute opacity-0 w-0 h-0 m-0 p-0"
                />
                <label 
                  htmlFor={`checkbox-${code.id}`} 
                  className={`inline-flex items-center justify-center w-[11.3px] h-[11.3px] min-w-[11.3px] min-h-[11.3px] border border-border rounded-[2.1px] bg-bg-secondary cursor-pointer transition-all relative flex-shrink-0 ${
                    isSelected ? 'bg-primary border-primary' : ''
                  }`}
                >
                  {isSelected && <span className="text-white text-[7.2px] font-bold leading-none flex items-center justify-center">✓</span>}
                </label>
              </div>
            )}
          </div>
        </div>

        {code.description && (
          <div className="flex-[2] overflow-visible min-h-0 min-w-0">
            <p className="text-text-secondary text-sm my-1.5 leading-snug overflow-hidden text-ellipsis line-clamp-2 opacity-85">
              {code.description}
            </p>
            {code.isFolder && code.folderStructure && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-primary font-semibold px-3 py-1.5 bg-gradient-to-br from-[rgba(0,175,202,0.2)] to-[rgba(0,153,204,0.15)] rounded-md border border-[rgba(0,175,202,0.4)] inline-flex items-center gap-1 shadow-[0_1px_3px_rgba(0,175,202,0.3)]">
                  {Object.keys(code.folderStructure).filter(key => code.folderStructure![key].type === 'file').length} файл
                  {Object.keys(code.folderStructure).filter(key => code.folderStructure![key].type === 'folder').length > 0 && 
                    `, ${Object.keys(code.folderStructure).filter(key => code.folderStructure![key].type === 'folder').length} папка`}
                </span>
              </div>
            )}
            {!code.isFolder && !isJsonStructure(code.content) && (
              <pre className="bg-[var(--bg-code)] rounded-[10px] p-3 m-0 overflow-x-auto text-xs leading-snug font-mono border border-[rgba(240,242,245,0.4)] shadow-[inset_0_2px_6px_rgba(0,0,0,0.5)] transition-all">
                <code className="text-text-primary whitespace-pre">{truncateContent(code.content, 100)}</code>
              </pre>
            )}
          </div>
        )}

        <div className="flex flex-col justify-between items-end gap-2 pl-3 border-l border-border flex-wrap flex-shrink-0 min-w-fit">
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="flex gap-2 text-xs items-center flex-nowrap justify-between">
              <span className="flex items-center gap-1.5 text-xs px-1.5 py-1 rounded-md bg-[rgba(0,0,0,0.12)] transition-all text-text-primary font-semibold">
                <FontAwesomeIcon icon={faUser} /> {code.author}
              </span>
              <span className="flex items-center gap-1.5 text-xs px-1.5 py-1 rounded-md bg-[rgba(0,0,0,0.12)] transition-all text-text-primary opacity-85 font-medium">
                <FontAwesomeIcon icon={faCalendar} /> {formatDateNumeric(code.createdAt)}
              </span>
            </div>
            <div className="flex gap-2 text-xs items-center flex-wrap">
              <span className="flex items-center gap-1.5 text-xs px-1.5 py-1 rounded-md transition-all text-primary font-bold drop-shadow-[0_0_8px_rgba(0,175,202,0.7)] bg-[rgba(0,175,202,0.2)]">
                <FontAwesomeIcon icon={faHeart} /> {code.likes?.length || 0}
              </span>
              <span className="flex items-center gap-1.5 text-xs px-1.5 py-1 rounded-md transition-all text-accent font-bold drop-shadow-[0_0_8px_rgba(0,153,204,0.7)] bg-[rgba(0,153,204,0.2)]">
                <FontAwesomeIcon icon={faComment} /> {code.comments?.length || 0}
              </span>
              <span className="flex items-center gap-1.5 text-xs px-1.5 py-1 rounded-md transition-all text-[var(--success-color)] font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.7)] bg-[rgba(16,185,129,0.2)]">
                <FontAwesomeIcon icon={faEye} /> {code.views || 0}
              </span>
            </div>
          </div>
          {code.tags && code.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {code.tags
                .filter(tag => tag.toLowerCase() !== 'folder')
                .slice(0, 3)
                .map((tag, index) => (
                  <span 
                    key={index} 
                    className="bg-gradient-to-br from-[rgba(0,175,202,0.25)] to-[rgba(0,153,204,0.2)] text-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-[rgba(0,175,202,0.5)] shadow-[0_2px_4px_rgba(0,175,202,0.3)] transition-all"
                  >
                    {tag}
                  </span>
                ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default CodeCard;

