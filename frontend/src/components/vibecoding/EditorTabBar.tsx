import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useVibecoding, detectLanguage } from '../../contexts/VibecodingContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const languageIcons: Record<string, { emoji: string; color: string }> = {
  javascript: { emoji: 'JS', color: '#f7df1e' },
  typescript: { emoji: 'TS', color: '#3178c6' },
  python: { emoji: '🐍', color: '#3776ab' },
  html: { emoji: '🌐', color: '#e34f26' },
  css: { emoji: '🎨', color: '#1572b6' },
  json: { emoji: '{}', color: '#a8a8a8' },
  markdown: { emoji: '📝', color: '#083fa1' },
  java: { emoji: '☕', color: '#ed8b00' },
  cpp: { emoji: 'C+', color: '#00599c' },
  c: { emoji: 'C', color: '#a8b9cc' },
  rust: { emoji: '🦀', color: '#dea584' },
  go: { emoji: 'Go', color: '#00add8' },
  php: { emoji: '🐘', color: '#777bb4' },
  shell: { emoji: '$', color: '#89e015' },
  sql: { emoji: '🗃️', color: '#e38c00' },
};

const EditorTabBar: React.FC = () => {
  const { t } = useTranslation();
  const { state, dispatch, openFiles } = useVibecoding();

  const handleCloseTab = useCallback((e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    dispatch({ type: 'CLOSE_FILE', payload: { fileId } });
  }, [dispatch]);

  const handleSelectTab = useCallback((fileId: string) => {
    dispatch({ type: 'SET_ACTIVE_FILE', payload: { fileId } });
  }, [dispatch]);

  if (openFiles.length === 0) return null;

  return (
    <div
      className="flex items-stretch overflow-x-auto flex-shrink-0 select-none"
      style={{
        backgroundColor: 'var(--ide-tab-inactive-bg)',
        borderBottom: '1px solid var(--ide-border)',
      }}
    >
      {openFiles.map((file) => {
        const isActive = file.id === state.activeFileId;
        const lang = detectLanguage(file.name);
        const iconInfo = languageIcons[lang] || { emoji: '📄', color: 'var(--ide-text-muted)' };

        return (
          <div
            key={file.id}
            onClick={() => handleSelectTab(file.id)}
            className={`
              group flex items-center gap-1.5 pl-3 pr-2 py-2 cursor-pointer text-xs
              border-r border-[var(--ide-border)] select-none transition-all duration-150
              min-w-0 max-w-[160px] relative
              ${isActive
                ? 'text-[var(--ide-text)]'
                : 'text-[var(--ide-text-muted)] hover:text-[var(--ide-text)]'
              }
            `}
            style={{
              backgroundColor: isActive ? 'var(--ide-tab-active-bg)' : 'transparent',
            }}
          >
            {/* Active tab top indicator */}
            {isActive && (
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ backgroundColor: 'var(--ide-accent)' }}
              />
            )}

            {/* File icon with language color */}
            <span
              className="text-[9px] font-bold flex-shrink-0 w-4 h-4 rounded flex items-center justify-center"
              style={{
                color: isActive ? '#fff' : iconInfo.color,
                backgroundColor: isActive ? 'var(--ide-accent)' : 'transparent',
              }}
            >
              {iconInfo.emoji.length <= 2 ? iconInfo.emoji : '📄'}
            </span>

            <span className="truncate flex-1">{file.name}</span>

            {/* Dirty dot or close button */}
            {file.isDirty && !isActive ? (
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--ide-accent)' }} />
            ) : (
              <button
                onClick={(e) => handleCloseTab(e, file.id)}
                className={`ml-0.5 rounded p-0.5 transition-all duration-150 ${
                  isActive
                    ? 'opacity-70 hover:opacity-100 hover:bg-[var(--ide-hover)]'
                    : 'opacity-0 group-hover:opacity-70 hover:opacity-100 hover:bg-[var(--ide-hover)]'
                }`}
                title={t('vibecoding.editor.closeTab', 'Жабу')}
              >
                <FontAwesomeIcon icon={faTimes} className="text-[9px]" />
              </button>
            )}

            {/* Dirty indicator for active tab */}
            {file.isDirty && isActive && (
              <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: 'var(--ide-accent)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EditorTabBar;