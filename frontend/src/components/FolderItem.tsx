import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faUser, faCalendar, faHeart, faComment } from '@fortawesome/free-solid-svg-icons';
import { CodeFile } from '../utils/api';
import { formatDate } from '../utils/dateFormatter';
import './FolderItem.css';

interface FolderItemProps {
  folder: CodeFile;
  viewMode?: 'grid' | 'list';
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const FolderItem: React.FC<FolderItemProps> = ({ folder, viewMode = 'grid', isSelected = false, onToggleSelect }) => {
  const { i18n } = useTranslation();

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSelect?.();
  };

  return (
    <div className={`folder-item-wrapper ${viewMode === 'list' ? 'list-mode' : ''} ${isSelected ? 'selected' : ''}`}>
      <Link 
        to={`/view/${folder.id}`}
        className={`folder-item ${viewMode === 'list' ? 'list-mode' : ''}`}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('.folder-item-checkbox')) {
            e.preventDefault();
          }
        }}
      >
        <div className="folder-item-header">
          <div className="folder-item-icon-wrapper">
            <span className="folder-item-icon"><FontAwesomeIcon icon={faFolder} /></span>
          </div>
          <div className="folder-item-content">
            <h3 className="folder-item-title">{folder.title}</h3>
            {folder.description && (
              <p className="folder-item-description">{folder.description}</p>
            )}
          </div>
          {onToggleSelect && (
            <div className="folder-item-checkbox" onClick={handleCheckboxClick}>
              <input
                type="checkbox"
                id={`folder-checkbox-${folder.id}`}
                checked={isSelected}
                onChange={() => {}}
                onClick={handleCheckboxClick}
                readOnly
              />
              <label htmlFor={`folder-checkbox-${folder.id}`} className="checkbox-label">
                {isSelected && <span className="checkbox-checkmark">✓</span>}
              </label>
            </div>
          )}
        </div>

        <div className="folder-item-footer">
          <div className="folder-item-meta">
            <span className="folder-item-author"><FontAwesomeIcon icon={faUser} /> {folder.author}</span>
            <span className="folder-item-date"><FontAwesomeIcon icon={faCalendar} /> {formatDate(folder.createdAt, i18n.language)}</span>
            {folder.likes && folder.likes.length > 0 && (
              <span className="folder-item-likes"><FontAwesomeIcon icon={faHeart} /> {folder.likes.length}</span>
            )}
            {folder.comments && folder.comments.length > 0 && (
              <span className="folder-item-comments"><FontAwesomeIcon icon={faComment} /> {folder.comments.length}</span>
            )}
          </div>
          {folder.tags && folder.tags.length > 0 && (
            <div className="folder-item-tags">
              {folder.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default FolderItem;

