import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useVibecoding, detectLanguage, VirtualFile } from '../../contexts/VibecodingContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolder,
  faFolderOpen,
  faPlus,
  faTrash,
  faEdit,
  faChevronRight,
  faChevronDown,
  faEllipsisH,
  faFileCode,
  faSearch,
  faFileAlt,
  faFolderPlus,
  faTimes,
  faCodeBranch,
  faCog,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';

// Modern file type icons with distinct visual identities
const fileTypeIcons: Record<string, { icon: typeof faFileCode; color: string; bg: string }> = {
  javascript:  { icon: faFileCode, color: '#f7df1e', bg: 'rgba(247,223,30,0.12)' },
  typescript:  { icon: faFileCode, color: '#3178c6', bg: 'rgba(49,120,198,0.12)' },
  python:      { icon: faFileCode, color: '#4584b6', bg: 'rgba(69,132,182,0.12)' },
  html:        { icon: faFileCode, color: '#e44d26', bg: 'rgba(228,77,38,0.12)' },
  css:         { icon: faFileCode, color: '#2965f1', bg: 'rgba(41,101,241,0.12)' },
  json:        { icon: faFileCode, color: '#a8a8a8', bg: 'rgba(168,168,168,0.12)' },
  markdown:    { icon: faFileCode, color: '#083fa1', bg: 'rgba(8,63,161,0.12)' },
  java:        { icon: faFileCode, color: '#ed8b00', bg: 'rgba(237,139,0,0.12)' },
  cpp:         { icon: faFileCode, color: '#00599c', bg: 'rgba(0,89,156,0.12)' },
  c:           { icon: faFileCode, color: '#a8b9cc', bg: 'rgba(168,185,204,0.12)' },
  rust:        { icon: faFileCode, color: '#dea584', bg: 'rgba(222,165,132,0.12)' },
  go:          { icon: faFileCode, color: '#00add8', bg: 'rgba(0,173,216,0.12)' },
  php:         { icon: faFileCode, color: '#777bb4', bg: 'rgba(119,123,180,0.12)' },
  shell:       { icon: faFileCode, color: '#89e015', bg: 'rgba(137,224,21,0.12)' },
  sql:         { icon: faFileCode, color: '#e38c00', bg: 'rgba(227,140,0,0.12)' },
};

interface FileNodeProps {
  file: VirtualFile;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}

const FileNode: React.FC<FileNodeProps> = ({ file, isActive, onSelect, onDelete, onRename }) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(file.name);
  const [showMenu, setShowMenu] = useState(false);

  const lang = detectLanguage(file.name);
  const iconInfo = fileTypeIcons[lang] || { icon: faFileAlt, color: 'var(--ide-text-muted)', bg: 'transparent' };

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== file.name) {
      onRename(renameValue.trim());
    }
    setIsRenaming(false);
  };

  const fileExt = file.name.includes('.') ? file.name.split('.').pop()?.toUpperCase() : '';

  return (
    <div
      className={`group relative flex items-center gap-0 cursor-pointer text-[12px] transition-all duration-200`}
      onClick={onSelect}
    >
      {/* Hover background */}
      <div
        className={`absolute inset-0 rounded-md transition-all duration-150 ${
          isActive ? '' : 'group-hover:bg-[var(--ide-hover)]'
        }`}
        style={isActive ? { backgroundColor: 'var(--ide-accent)', opacity: 0.9 } : undefined}
      />

      {/* Active left indicator */}
      {isActive && (
        <div
          className="absolute left-0 top-1 bottom-1 w-[2.5px] rounded-r-full"
          style={{ backgroundColor: '#fff' }}
        />
      )}

      <div className="relative flex items-center gap-2.5 px-3 py-[6px] w-full">
        {/* File type badge */}
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold flex-shrink-0"
          style={{
            backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : iconInfo.bg,
            color: isActive ? '#fff' : iconInfo.color,
          }}
        >
          {fileExt || '?'}
        </div>

        {isRenaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') setIsRenaming(false);
            }}
            className="flex-1 bg-[var(--ide-editor-bg)] border border-[var(--ide-accent)] text-[var(--ide-text)] px-1.5 py-0.5 text-[12px] outline-none rounded-sm min-w-0"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="flex-1 truncate font-medium"
            style={{ color: isActive ? '#fff' : 'var(--ide-text)' }}
          >
            {file.name}
          </span>
        )}

        {/* Dirty dot */}
        {file.isDirty && !isRenaming && (
          <span
            className="w-[6px] h-[6px] rounded-full flex-shrink-0"
            style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.8)' : 'var(--ide-accent)' }}
          />
        )}

        {/* Context menu trigger */}
        {!isRenaming && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className={`p-1 rounded-md transition-all duration-150 ${
                isActive ? 'opacity-70 hover:opacity-100 hover:bg-white/20' : 'opacity-0 group-hover:opacity-60 hover:opacity-100 hover:bg-[var(--ide-hover)]'
              }`}
            >
              <FontAwesomeIcon icon={faEllipsisH} className="text-[10px]" style={{ color: isActive ? '#fff' : 'var(--ide-text-muted)' }} />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setShowMenu(false)} />
                <div
                  className="absolute right-0 top-full z-[101] mt-0.5 py-1 rounded-lg shadow-2xl min-w-[160px] text-[12px] animate-fadeIn"
                  style={{
                    backgroundColor: 'var(--ide-sidebar-bg)',
                    border: '1px solid var(--ide-border)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRenaming(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[var(--ide-hover)] flex items-center gap-2.5 transition-colors"
                  >
                    <FontAwesomeIcon icon={faEdit} className="w-3.5 text-[var(--ide-text-muted)]" />
                    <span>Атауын өзгерту</span>
                    <span className="ml-auto text-[10px] text-[var(--ide-text-muted)] opacity-50">F2</span>
                  </button>
                  <div className="my-1 mx-2 border-t border-[var(--ide-border)]" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-500/15 text-red-400 flex items-center gap-2.5 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-3.5" />
                    <span>Жою</span>
                    <span className="ml-auto text-[10px] opacity-50">Del</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const FileExplorerPanel: React.FC = () => {
  const { t } = useTranslation();
  const { state, dispatch, activeProject, isMobile, isTablet } = useVibecoding();
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isOverlay = isMobile || isTablet;

  const handleCreateFile = useCallback(() => {
    if (!newFileName.trim()) return;
    dispatch({
      type: 'CREATE_FILE',
      payload: { name: newFileName.trim(), path: newFileName.trim(), content: '' },
    });
    setNewFileName('');
    setShowNewFile(false);
  }, [dispatch, newFileName]);

  const handleDeleteFile = useCallback((fileId: string) => {
    dispatch({ type: 'DELETE_FILE', payload: { fileId } });
  }, [dispatch]);

  const handleRenameFile = useCallback((fileId: string, name: string) => {
    dispatch({ type: 'RENAME_FILE', payload: { fileId, name } });
  }, [dispatch]);

  const handleSelectFile = useCallback((fileId: string) => {
    dispatch({ type: 'OPEN_FILE', payload: { fileId } });
  }, [dispatch]);

  const handleSwitchProject = useCallback((projectId: string) => {
    dispatch({ type: 'SWITCH_PROJECT', payload: { projectId } });
    setShowProjectMenu(false);
  }, [dispatch]);

  const handleCreateProject = useCallback(() => {
    dispatch({ type: 'CREATE_PROJECT', payload: { name: `Project ${state.projects.length + 1}` } });
    setShowProjectMenu(false);
  }, [dispatch, state.projects.length]);

  const filteredFiles = useMemo(() =>
    activeProject?.files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())) || [],
    [activeProject, searchQuery]
  );

  if (!activeProject) {
    return (
      <div className="h-full flex flex-col bg-[var(--ide-sidebar-bg)]">
        <div className="flex-1 flex items-center justify-center text-[var(--ide-text-muted)] text-xs p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--ide-accent)', opacity: 0.1 }}>
              <FontAwesomeIcon icon={faFolderOpen} className="text-2xl" style={{ color: 'var(--ide-accent)' }} />
            </div>
            <p className="mb-3 text-sm font-medium text-[var(--ide-text)]">{t('vibecoding.fileExplorer.emptyProject')}</p>
            <button
              onClick={handleCreateProject}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: 'var(--ide-accent)', color: '#fff' }}
            >
              <FontAwesomeIcon icon={faFolderPlus} className="mr-1.5" />
              {t('vibecoding.fileExplorer.newProject')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--ide-sidebar-bg)] select-none">
      {/* Overlay close button (mobile/tablet only) */}
      {isOverlay && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--ide-border)] flex-shrink-0">
          <span className="text-xs font-semibold text-[var(--ide-text)]">{t('vibecoding.fileExplorer.title')}</span>
          <button
            onClick={() => dispatch({ type: 'SET_LEFT_PANEL_VISIBLE', payload: false })}
            className="p-1.5 rounded-md text-[var(--ide-text-muted)] hover:text-[var(--ide-text)] hover:bg-[var(--ide-hover)] transition-colors"
            title="Жабу"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-[10px]" />
          </button>
        </div>
      )}

      {/* Project selector header */}
      <div className="px-2 pt-2 pb-1.5 flex-shrink-0">
        <button
          onClick={() => setShowProjectMenu(!showProjectMenu)}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] font-semibold text-[var(--ide-text)] hover:bg-[var(--ide-hover)] transition-all duration-200 group"
        >
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--ide-accent)', opacity: 0.15 }}
          >
            <FontAwesomeIcon icon={faFolderOpen} className="text-[10px]" style={{ color: 'var(--ide-accent)' }} />
          </div>
          <span className="flex-1 text-left truncate">{activeProject.name}</span>
          <FontAwesomeIcon
            icon={showProjectMenu ? faChevronDown : faChevronRight}
            className="text-[8px] text-[var(--ide-text-muted)] transition-transform duration-200"
            style={{ transform: showProjectMenu ? 'rotate(0deg)' : 'rotate(0deg)' }}
          />
        </button>

        {/* Project dropdown */}
        {showProjectMenu && (
          <>
            <div className="fixed inset-0 z-50" onClick={() => setShowProjectMenu(false)} />
            <div
              className="absolute left-2 right-2 z-50 mt-1 py-1 rounded-xl shadow-2xl text-[12px] animate-fadeIn"
              style={{
                backgroundColor: 'var(--ide-sidebar-bg)',
                border: '1px solid var(--ide-border)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
              }}
            >
              {/* Project list header */}
              <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-[var(--ide-text-muted)] font-bold flex items-center gap-1.5">
                <FontAwesomeIcon icon={faCodeBranch} className="text-[8px]" />
                {t('vibecoding.fileExplorer.projects')}
              </div>

              {state.projects.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => handleSwitchProject(proj.id)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-[var(--ide-hover)] flex items-center gap-2.5 transition-all duration-150 ${
                    proj.id === activeProject.id ? 'bg-[var(--ide-accent)]/10' : ''
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[9px]"
                    style={{
                      backgroundColor: proj.id === activeProject.id ? 'var(--ide-accent)' : 'var(--ide-hover)',
                      color: proj.id === activeProject.id ? '#fff' : 'var(--ide-text-muted)',
                    }}
                  >
                    <FontAwesomeIcon icon={faFolder} className="text-[9px]" />
                  </div>
                  <span className={`truncate ${proj.id === activeProject.id ? 'text-[var(--ide-accent)] font-medium' : 'text-[var(--ide-text)]'}`}>
                    {proj.name}
                  </span>
                  <span className="ml-auto text-[10px] text-[var(--ide-text-muted)] bg-[var(--ide-hover)] px-1.5 py-0.5 rounded-md">
                    {proj.files.length}
                  </span>
                </button>
              ))}

              <div className="my-1 mx-3 border-t border-[var(--ide-border)]" />

              <button
                onClick={handleCreateProject}
                className="w-full text-left px-3 py-2.5 hover:bg-[var(--ide-hover)] flex items-center gap-2.5 transition-colors text-[var(--ide-accent)]"
              >
                <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--ide-accent)', opacity: 0.15 }}>
                  <FontAwesomeIcon icon={faPlus} className="text-[9px]" />
                </div>
                <span className="font-medium">{t('vibecoding.fileExplorer.newProject')}</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Section header: Explorer */}
      <div className="flex items-center justify-between px-3 py-1.5 flex-shrink-0">
        <span className="text-[10px] uppercase tracking-[0.1em] font-bold text-[var(--ide-text-muted)]">
          {t('vibecoding.fileExplorer.title')}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setShowNewFile(!showNewFile)}
            className={`p-1.5 rounded-md transition-all duration-200 ${
              showNewFile
                ? 'text-[var(--ide-accent)] bg-[var(--ide-accent)]/10'
                : 'text-[var(--ide-text-muted)] hover:text-[var(--ide-accent)] hover:bg-[var(--ide-hover)]'
            }`}
            title={t('vibecoding.fileExplorer.newFile')}
          >
            <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      {activeProject.files.length > 2 && (
        <div className="px-3 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--ide-editor-bg)] border border-[var(--ide-border)] focus-within:border-[var(--ide-accent)] transition-colors">
            <FontAwesomeIcon icon={faSearch} className="text-[10px] text-[var(--ide-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Іздеу..."
              className="flex-1 bg-transparent border-none outline-none text-[11px] text-[var(--ide-text)] placeholder-[var(--ide-text-muted)] w-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-0.5 rounded text-[var(--ide-text-muted)] hover:text-[var(--ide-text)] transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-[8px]" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* New file input */}
      {showNewFile && (
        <div className="px-3 pb-2 flex-shrink-0 animate-fadeIn">
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--ide-editor-bg)] border-2 border-[var(--ide-accent)] shadow-[0_0_8px_rgba(0,175,202,0.15)]">
            <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--ide-accent)', opacity: 0.15 }}>
              <FontAwesomeIcon icon={faFileCode} className="text-[8px]" style={{ color: 'var(--ide-accent)' }} />
            </div>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') { setShowNewFile(false); setNewFileName(''); }
              }}
              placeholder="filename.ext"
              className="flex-1 bg-transparent border-none outline-none text-[12px] text-[var(--ide-text)] placeholder-[var(--ide-text-muted)] min-w-0"
              autoFocus
            />
            <button
              onClick={() => { setShowNewFile(false); setNewFileName(''); }}
              className="p-1 rounded text-[var(--ide-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} className="text-[9px]" />
            </button>
          </div>
        </div>
      )}

      {/* Thin divider */}
      <div className="mx-3 border-t border-[var(--ide-border)]" />

      {/* File list */}
      <div className="flex-1 overflow-y-auto py-1 ide-scrollbar">
        {filteredFiles.length === 0 ? (
          <div className="px-3 py-8 text-[var(--ide-text-muted)] text-xs text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--ide-hover)' }}>
              <FontAwesomeIcon icon={faFileAlt} className="text-lg opacity-30" />
            </div>
            {searchQuery ? 'Ештеңе табылмады' : t('vibecoding.fileExplorer.emptyProject')}
          </div>
        ) : (
          filteredFiles.map((file) => (
            <FileNode
              key={file.id}
              file={file}
              isActive={file.id === state.activeFileId}
              onSelect={() => handleSelectFile(file.id)}
              onDelete={() => handleDeleteFile(file.id)}
              onRename={(name) => handleRenameFile(file.id, name)}
            />
          ))
        )}
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-[var(--ide-border)] flex-shrink-0">
        <span className="text-[10px] text-[var(--ide-text-muted)] font-medium">
          {activeProject.files.length} файл{activeProject.files.length === 1 ? '' : activeProject.files.length > 1 && activeProject.files.length < 5 ? '' : ''}
        </span>
        <div className="flex items-center gap-2">
          {activeProject.files.some(f => f.isDirty) && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--ide-accent)' }}>
              <span className="w-[5px] h-[5px] rounded-full animate-pulse" style={{ backgroundColor: 'var(--ide-accent)' }} />
              өзгертілді
            </span>
          )}
          <button
            className="p-1 rounded text-[var(--ide-text-muted)] hover:text-[var(--ide-text)] hover:bg-[var(--ide-hover)] transition-colors"
            title="Баптау"
          >
            <FontAwesomeIcon icon={faCog} className="text-[9px]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileExplorerPanel;