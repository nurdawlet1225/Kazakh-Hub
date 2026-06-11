import React, { useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useVibecoding, detectLanguage } from '../../contexts/VibecodingContext';
import EditorTabBar from './EditorTabBar';
import Editor, { OnMount } from '@monaco-editor/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faFileAlt } from '@fortawesome/free-solid-svg-icons';

const EditorPanel: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { dispatch, activeFile } = useVibecoding();
  const editorRef = useRef<any>(null);

  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (activeFile && value !== undefined) {
      dispatch({ type: 'UPDATE_FILE_CONTENT', payload: { fileId: activeFile.id, content: value } });
    }
  }, [activeFile, dispatch]);

  const editorLanguage = useMemo(() => {
    if (!activeFile) return 'plaintext';
    return detectLanguage(activeFile.name);
  }, [activeFile]);

  // Empty state when no file is open
  if (!activeFile) {
    return (
      <div className="h-full flex flex-col bg-[var(--ide-editor-bg)]">
        <EditorTabBar />
        <div className="flex-1 flex items-center justify-center text-[var(--ide-text-muted)]">
          <div className="text-center animate-fadeIn">
            {/* Animated code icon */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div
                className="absolute inset-0 rounded-2xl opacity-10"
                style={{ backgroundColor: 'var(--ide-accent)' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faCode}
                  className="text-3xl"
                  style={{ color: 'var(--ide-accent)' }}
                />
              </div>
              {/* Floating particles */}
              <div
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full opacity-60 animate-bounce"
                style={{ backgroundColor: 'var(--ide-accent)', animationDelay: '0s', animationDuration: '2s' }}
              />
              <div
                className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full opacity-40 animate-bounce"
                style={{ backgroundColor: 'var(--accent-color)', animationDelay: '0.5s', animationDuration: '2.5s' }}
              />
            </div>

            <h3 className="text-base font-semibold text-[var(--ide-text)] mb-2">
              {t('vibecoding.editor.noFileOpen', 'Файл ашылмаған')}
            </h3>
            <p className="text-xs opacity-60 max-w-[250px] mx-auto leading-relaxed">
              {t('vibecoding.editor.noFileOpenHint', 'Эксплорерден файл таңдаңыз немесе жаңа файл жасаңыз')}
            </p>

            {/* Keyboard shortcut hints */}
            <div className="flex items-center justify-center gap-4 mt-6 text-[10px] opacity-40">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: 'var(--ide-border)', color: 'var(--ide-text-muted)' }}>
                  Ctrl
                </kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: 'var(--ide-border)', color: 'var(--ide-text-muted)' }}>
                  B
                </kbd>
                <span className="ml-1">Эксплорер</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: 'var(--ide-border)', color: 'var(--ide-text-muted)' }}>
                  Ctrl
                </kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: 'var(--ide-border)', color: 'var(--ide-text-muted)' }}>
                  J
                </kbd>
                <span className="ml-1">Терминал</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--ide-editor-bg)]">
      <EditorTabBar />
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={editorLanguage}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          value={activeFile.content}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          path={activeFile.path}
          options={{
            minimap: { enabled: true, scale: 2 },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontLigatures: true,
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 8, bottom: 8 },
            suggestOnTriggerCharacters: true,
            tabSize: 2,
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            formatOnPaste: true,
            formatOnType: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-[var(--ide-editor-bg)] text-[var(--ide-text-muted)]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-[var(--ide-accent)] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">{t('vibecoding.editor.loading', 'Редактор жүктелуде...')}</span>
              </div>
            </div>
          }
        />
      </div>
      {/* Status bar */}
      <div
        className="h-[22px] flex items-center px-3 text-[10px] justify-between flex-shrink-0 select-none"
        style={{
          backgroundColor: 'var(--ide-accent)',
          color: 'var(--ide-status-bar-text, #fff)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <FontAwesomeIcon icon={faFileAlt} className="text-[8px]" />
            {editorLanguage.toUpperCase()}
          </span>
          <span>UTF-8</span>
          <span>LF</span>
        </div>
        <div className="flex items-center gap-3">
          {activeFile.isDirty && (
            <span className="flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              {t('vibecoding.editor.unsaved', 'Сақталмаған')}
            </span>
          )}
          <span>Spaces: 2</span>
        </div>
      </div>
    </div>
  );
};

export default EditorPanel;