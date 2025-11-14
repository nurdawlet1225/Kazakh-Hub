import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import './CodeEditor.css';

interface CodeEditorProps {
  code: string;
  language: string;
  readOnly?: boolean;
  onChange?: (code: string) => void;
  lineNumbers?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  readOnly = false,
  onChange,
  lineNumbers = true,
}) => {
  const [content, setContent] = useState(code);

  useEffect(() => {
    setContent(code);
  }, [code]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    onChange?.(newContent);
  };

  const getLanguageId = (lang: string): string => {
    const langMap: Record<string, string> = {
      javascript: 'javascript',
      typescript: 'typescript',
      python: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      html: 'html',
      css: 'css',
      json: 'json',
      markdown: 'markdown',
    };
    return langMap[lang.toLowerCase()] || 'plaintext';
  };

  if (readOnly) {
    return (
      <div className="code-editor read-only">
        <div className="code-editor-content">
        <SyntaxHighlighter
          language={getLanguageId(language)}
          style={vscDarkPlus}
          showLineNumbers={lineNumbers}
          customStyle={{
            margin: 0,
            borderRadius: '8px',
            padding: '1.5rem',
            fontSize: '0.9rem',
            lineHeight: '1.6',
              overflow: 'visible',
          }}
        >
          {content}
        </SyntaxHighlighter>
        </div>
      </div>
    );
  }

  return (
    <div className="code-editor">
      <div className="code-editor-header">
        <span className="code-editor-language">{language}</span>
        <button
          className="code-editor-copy"
          onClick={() => {
            navigator.clipboard.writeText(content);
          }}
        >
          <FontAwesomeIcon icon={faCopy} /> Көшіру
        </button>
      </div>
      <textarea
        className="code-editor-textarea"
        value={content}
        onChange={handleChange}
        spellCheck={false}
        placeholder="Кодыңызды енгізіңіз..."
      />
    </div>
  );
};

export default CodeEditor;

