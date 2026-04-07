import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faHeart, faComment, faEye, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { CodeFile } from '../utils/api';
import './CodeCard.css';

interface CodeCardProps {
  code: CodeFile;
  viewMode?: 'grid' | 'list';
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const CodeCard: React.FC<CodeCardProps> = ({ code, viewMode = 'grid', isSelected = false, onToggleSelect }) => {
  const { t } = useTranslation();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const cardWrapperRef = useRef<HTMLDivElement>(null);

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

  const handleToggleDescription = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const willExpand = !isDescriptionExpanded;
    setIsDescriptionExpanded(willExpand);
    
    // Scroll into view when expanding - scroll card to top of scrollable container
    if (willExpand) {
      // Find the scrollable parent container
      const findScrollableParent = (element: HTMLElement | null): HTMLElement | null => {
        if (!element) return null;
        let parent = element.parentElement;
        
        while (parent) {
          const style = window.getComputedStyle(parent);
          const hasOverflow = style.overflowY === 'auto' || style.overflowY === 'scroll';
          const hasMaxHeight = style.maxHeight && style.maxHeight !== 'none';
          
          if (hasOverflow && hasMaxHeight) {
            return parent;
          }
          
          parent = parent.parentElement;
        }
        
        return null;
      };
      
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (cardWrapperRef.current) {
            const scrollableParent = findScrollableParent(cardWrapperRef.current);
            
            if (scrollableParent) {
              // Get current positions
              const cardRect = cardWrapperRef.current.getBoundingClientRect();
              const parentRect = scrollableParent.getBoundingClientRect();
              const currentScrollTop = scrollableParent.scrollTop;
              
              // Calculate the card's position relative to the scrollable parent's content
              const cardTopInParent = cardRect.top - parentRect.top + currentScrollTop;
              
              // Scroll to position card at the top of the visible area
              scrollableParent.scrollTo({
                top: cardTopInParent,
                behavior: 'smooth'
              });
            } else {
              // Fallback to scrollIntoView if no scrollable parent found
              cardWrapperRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
              });
            }
          }
        }, 150);
      });
    }
  };

  const fullDescriptionText = code.description 
    ? code.description 
    : !code.isFolder && !isJsonStructure(code.content) 
      ? code.content 
      : null;
  
  const truncatedDescriptionText = fullDescriptionText 
    ? truncateContent(fullDescriptionText, 100)
    : null;
  
  const descriptionText = isDescriptionExpanded 
    ? fullDescriptionText 
    : truncatedDescriptionText;
  
  const shouldShowToggleButton = fullDescriptionText && fullDescriptionText.length > 100;


  return (
    <div 
      ref={cardWrapperRef}
      className={`code-card-wrapper ${viewMode === 'list' ? 'list-mode' : ''} ${isSelected ? 'selected' : ''}`}
    >
      <Link 
        to={`/view/${code.id}`}
        className={`code-card ${viewMode === 'list' ? 'list-mode' : ''}`}
        onClick={(e) => {
          // If clicking on checkbox or toggle button, prevent navigation
          if ((e.target as HTMLElement).closest('.code-card-checkbox') ||
              (e.target as HTMLElement).closest('.code-card-description-toggle')) {
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
              <p 
                ref={descriptionRef}
                className={`code-card-description-below ${isDescriptionExpanded ? 'expanded' : ''}`}
              >
                {descriptionText ? (
                  descriptionText
                ) : (
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontStyle: 'italic' }}>
                    {code.isFolder ? t('codeCard.folderInfo') : t('codeCard.noDescription')}
                  </span>
                )}
              </p>
              {shouldShowToggleButton && (
                <button 
                  className="code-card-description-toggle"
                  onClick={handleToggleDescription}
                  type="button"
                >
                  <FontAwesomeIcon icon={isDescriptionExpanded ? faChevronUp : faChevronDown} />
                </button>
              )}
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
          {code.isFolder && code.folderStructure && (() => {
            const fileCount = Object.keys(code.folderStructure).filter(key => code.folderStructure![key].type === 'file').length;
            const folderCount = Object.keys(code.folderStructure).filter(key => code.folderStructure![key].type === 'folder').length;
            
            // Helper function for pluralization
            const getPlural = (count: number, singular: string, plural: string) => {
              return count === 1 ? singular : plural;
            };
            
            const fileText = getPlural(fileCount, t('viewCode.file'), t('viewCode.filesPlural'));
            const folderText = getPlural(folderCount, t('viewCode.folder'), t('viewCode.foldersPlural'));
            
            return (
              <span className="folder-stats-button">
                {fileCount} {fileText}
                {folderCount > 0 && `, ${folderCount} ${folderText}`}
              </span>
            );
          })()}

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
