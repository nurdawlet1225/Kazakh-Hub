import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import './WebTerminal.css';

interface WebTerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WebTerminal: React.FC<WebTerminalProps> = ({ isOpen, onClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isOpen || !terminalRef.current || isInitialized) return;

    // Create terminal instance
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#aeafad',
        selectionBackground: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    
    terminal.open(terminalRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = terminal;
    fitAddonRef.current = fitAddon;
    setIsInitialized(true);

    // Welcome message
    terminal.writeln('\x1b[36m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
    terminal.writeln('\x1b[36m║\x1b[0m  \x1b[32mN3XUS-OS Terminal\x1b[0m - Kazakh Hub Terminal Interface  \x1b[36m║\x1b[0m');
    terminal.writeln('\x1b[36m╚═══════════════════════════════════════════════════════════╝\x1b[0m');
    terminal.writeln('');
    terminal.writeln('\x1b[33m⚠️  Ескерту:\x1b[0m Бұл веб-терминал интерфейсі.');
    terminal.writeln('Нақты терминалды іске қосу үшін төмендегі командаларды пайдаланыңыз:');
    terminal.writeln('');
    terminal.writeln('\x1b[36m📋 Терминалды іске қосу:\x1b[0m');
    terminal.writeln('');
    terminal.writeln('\x1b[32mWindows (Command Prompt):\x1b[0m');
    terminal.writeln('  cd "C:\\Users\\nurda\\code\\Kazakh Hub\\nairee_cli"');
    terminal.writeln('  run.bat');
    terminal.writeln('');
    terminal.writeln('\x1b[32mWindows (PowerShell):\x1b[0m');
    terminal.writeln('  cd "C:\\Users\\nurda\\code\\Kazakh Hub\\nairee_cli"');
    terminal.writeln('  .\\run.ps1');
    terminal.writeln('');
    terminal.writeln('\x1b[36m📝 Код жүктеу командасы:\x1b[0m');
    terminal.writeln('  upload <file_path> --author "<author_name>" [options]');
    terminal.writeln('');
    terminal.writeln('\x1b[36m💡 Мысалдар:\x1b[0m');
    terminal.writeln('  upload main.cpp --author "John Doe" --title "My C++ Program"');
    terminal.writeln('  upload app.py --author "Jane Smith" --language "Python"');
    terminal.writeln('');
    terminal.writeln('\x1b[33mНақты терминалды іске қосу үшін жоғарыдағы командаларды көшіріп,');
    terminal.writeln('өз терминалыңызда орындаңыз.\x1b[0m');
    terminal.writeln('');
    
    // Simulate prompt
    terminal.write('\x1b[36mN3XUS\x1b[0m::\x1b[32m/web-terminal\x1b[0m $ ');

    // Handle input
    let currentLine = '';
    terminal.onData((data) => {
      const code = data.charCodeAt(0);
      
      // Enter key
      if (code === 13) {
        terminal.write('\r\n');
        handleCommand(currentLine.trim(), terminal);
        currentLine = '';
        terminal.write('\x1b[36mN3XUS\x1b[0m::\x1b[32m/web-terminal\x1b[0m $ ');
      }
      // Backspace
      else if (code === 127 || code === 8) {
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          terminal.write('\b \b');
        }
      }
      // Printable characters
      else if (code >= 32 && code <= 126) {
        currentLine += data;
        terminal.write(data);
      }
    });

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
      setIsInitialized(false);
    };
  }, [isOpen, isInitialized]);

  const handleCommand = (command: string, terminal: Terminal) => {
    if (!command) return;

    const cmd = command.toLowerCase().trim();

    if (cmd === 'help' || cmd === 'h') {
      terminal.writeln('');
      terminal.writeln('\x1b[36m📋 Қолжетімді командалар:\x1b[0m');
      terminal.writeln('');
      terminal.writeln('  \x1b[32mhelp\x1b[0m          - Барлық командаларды көрсету');
      terminal.writeln('  \x1b[32mclear\x1b[0m         - Экранды тазалау');
      terminal.writeln('  \x1b[32mstart\x1b[0m         - Терминалды іске қосу командасын көрсету');
      terminal.writeln('  \x1b[32mupload\x1b[0m        - Код жүктеу командасын көрсету');
      terminal.writeln('  \x1b[32mexit\x1b[0m / \x1b[32mquit\x1b[0m   - Шығу');
      terminal.writeln('');
    } else if (cmd === 'clear' || cmd === 'cls') {
      terminal.clear();
      terminal.write('\x1b[36mN3XUS\x1b[0m::\x1b[32m/web-terminal\x1b[0m $ ');
    } else if (cmd === 'start') {
      terminal.writeln('');
      terminal.writeln('\x1b[36m🚀 Терминалды іске қосу:\x1b[0m');
      terminal.writeln('');
      terminal.writeln('\x1b[32mCommand Prompt:\x1b[0m');
      terminal.writeln('  cd "C:\\Users\\nurda\\code\\Kazakh Hub\\nairee_cli"');
      terminal.writeln('  run.bat');
      terminal.writeln('');
      terminal.writeln('\x1b[32mPowerShell:\x1b[0m');
      terminal.writeln('  cd "C:\\Users\\nurda\\code\\Kazakh Hub\\nairee_cli"');
      terminal.writeln('  .\\run.ps1');
      terminal.writeln('');
    } else if (cmd === 'upload') {
      terminal.writeln('');
      terminal.writeln('\x1b[36m📤 Код жүктеу командасы:\x1b[0m');
      terminal.writeln('');
      terminal.writeln('  upload <file_path> --author "<author_name>" [options]');
      terminal.writeln('');
      terminal.writeln('\x1b[33mОпциялар:\x1b[0m');
      terminal.writeln('  --title <title>        Код атауы');
      terminal.writeln('  --author <author>       Автор аты (міндетті)');
      terminal.writeln('  --language <lang>       Бағдарламалау тілі');
      terminal.writeln('  --description <desc>   Сипаттама');
      terminal.writeln('');
      terminal.writeln('\x1b[33mМысалдар:\x1b[0m');
      terminal.writeln('  upload main.cpp --author "John Doe" --title "My C++ Program"');
      terminal.writeln('  upload app.py --author "Jane Smith" --language "Python"');
      terminal.writeln('');
    } else if (cmd === 'exit' || cmd === 'quit') {
      onClose();
    } else {
      terminal.writeln(`\x1b[31mҚате: "${command}" командасы табылмады.\x1b[0m`);
      terminal.writeln('  \x1b[33m"help"\x1b[0m командасын пайдаланып, қолжетімді командаларды көріңіз.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="web-terminal-overlay" onClick={onClose}>
      <div className="web-terminal-container" onClick={(e) => e.stopPropagation()}>
        <div className="web-terminal-header">
          <div className="web-terminal-title">
            <span className="terminal-icon">💻</span>
            <span>N3XUS-OS Terminal</span>
          </div>
          <button className="web-terminal-close" onClick={onClose}>×</button>
        </div>
        <div className="web-terminal-body">
          <div ref={terminalRef} className="web-terminal-content"></div>
        </div>
        <div className="web-terminal-footer">
          <p className="terminal-hint">
            💡 Нақты терминалды іске қосу үшін <code>start</code> командасын орындаңыз
          </p>
        </div>
      </div>
    </div>
  );
};

export default WebTerminal;

