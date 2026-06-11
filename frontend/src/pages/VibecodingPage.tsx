import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVibecoding, VibecodingProvider } from '../contexts/VibecodingContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCode,
  faTerminal,
  faRobot,
  faFolderTree,
  faUpload,
  faComments,
  faHome,
  faSun,
  faMoon,
  faBars,
} from '@fortawesome/free-solid-svg-icons';
import IDELayout from '../components/vibecoding/IDELayout';
import { useTheme } from '../contexts/ThemeContext';

/* ─── Code symbols that float in the background ─── */
const CODE_SYMBOLS = [
  '{ }', '( )', '< />', '[ ]', '=>', '&&', '||', '::', '++',
  '///', '/* */', 'fn()', 'if', '0xFF', '#!', '===', '?.',
  'as', 'let', 'int', 'pub', 'use', 'mod', 'val', 'ref',
  'async', 'await', 'yield', 'return', 'match', 'trait',
];

/* ─── Syntax colors for the symbols (BRIGHT) ─── */
const DARK_COLORS = [
  'rgba(0,175,202,0.18)',   // cyan — keywords
  'rgba(199,146,234,0.16)', // purple — types
  'rgba(195,232,141,0.14)', // green — strings
  'rgba(247,140,108,0.14)', // orange — functions
  'rgba(255,203,107,0.14)', // yellow — numbers
];
const LIGHT_COLORS = [
  'rgba(0,120,160,0.10)',
  'rgba(100,60,150,0.08)',
  'rgba(40,110,20,0.08)',
  'rgba(180,80,30,0.06)',
  'rgba(160,120,10,0.06)',
];

/* ─── Star field: generate random positions once ─── */
function generateStars(count: number) {
  const stars: { x: number; y: number; size: number; delay: number; dur: number }[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 0.5 + Math.random() * 2,
      delay: Math.random() * 6,
      dur: 2 + Math.random() * 4,
    });
  }
  return stars;
}
const STARS = generateStars(120);

/* ─── Main component ─── */
const VibecodingPageInner: React.FC = () => {
  const { t } = useTranslation();
  const { state, dispatch, activeFile, isMobile, isDesktop } = useVibecoding();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Parallax mouse tracking — use requestAnimationFrame for smoothness
  const mouseRef = useRef({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
    };
  }, []);

  // Smooth rAF loop for parallax
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      setMousePos({ ...mouseRef.current });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('mousemove', handleMouseMove);
    return () => el.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  const isDark = theme === 'dark';
  const symColors = isDark ? DARK_COLORS : LIGHT_COLORS;

  // Parallax shift per layer — MULTIPLIED for visible effect
  const px = (depth: number) => ({
    transform: `translate(${mousePos.x * depth}px, ${mousePos.y * depth}px)`,
    willChange: 'transform' as const,
  });

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex flex-col overflow-hidden select-none"
      style={{
        color: 'var(--ide-text)',
        zIndex: 100,
      }}
    >
      {/* ═══════════════════════════════════════════════════
          VIBECODING PARALLAX BACKGROUND
          6 layers, each reacting to mouse at different depths
          ═══════════════════════════════════════════════════ */}

      {/* Layer 0: Deep space base — moves least (depth: 6px) */}
      <div
        className="absolute inset-0"
        style={{
          ...px(6),
          background: isDark
            ? 'radial-gradient(ellipse at 30% 40%, #0f1520 0%, #0a0e18 40%, #050810 100%)'
            : 'radial-gradient(ellipse at 30% 40%, #f2f6fb 0%, #e6ecf4 40%, #d8e0eb 100%)',
        }}
      />

      {/* Layer 1: Nebula / Aurora — depth: 25px — BRIGHT orbs */}
      <div className="absolute inset-0 overflow-hidden" style={px(25)}>
        {/* Primary aurora — cyan, large */}
        <div
          className="absolute rounded-full animate-vibe-orb1"
          style={{
            width: '1200px', height: '900px',
            background: isDark
              ? 'radial-gradient(ellipse, rgba(0,175,202,0.22) 0%, rgba(0,175,202,0.06) 40%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(0,175,202,0.08) 0%, transparent 60%)',
            top: '30%', left: '-25%',
            filter: 'blur(100px)',
          }}
        />
        {/* Secondary — purple */}
        <div
          className="absolute rounded-full animate-vibe-orb2"
          style={{
            width: '900px', height: '700px',
            background: isDark
              ? 'radial-gradient(ellipse, rgba(130,80,220,0.18) 0%, rgba(130,80,220,0.04) 40%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(100,60,180,0.06) 0%, transparent 60%)',
            top: '-25%', right: '-15%',
            filter: 'blur(90px)',
          }}
        />
        {/* Tertiary — amber/warm */}
        <div
          className="absolute rounded-full animate-vibe-orb3"
          style={{
            width: '700px', height: '550px',
            background: isDark
              ? 'radial-gradient(ellipse, rgba(247,140,108,0.14) 0%, rgba(247,140,108,0.03) 40%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(220,120,60,0.04) 0%, transparent 60%)',
            bottom: '0%', left: '35%',
            filter: 'blur(80px)',
          }}
        />
        {/* Fourth — green accent */}
        <div
          className="absolute rounded-full animate-vibe-orb4"
          style={{
            width: '600px', height: '500px',
            background: isDark
              ? 'radial-gradient(ellipse, rgba(195,232,141,0.10) 0%, rgba(195,232,141,0.02) 40%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(60,130,30,0.03) 0%, transparent 60%)',
            bottom: '20%', right: '10%',
            filter: 'blur(70px)',
          }}
        />
      </div>

      {/* Layer 2: Stars — depth: 40px */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={px(40)}>
        {STARS.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-vibe-twinkle"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: isDark
                ? (i % 5 === 0 ? 'rgba(0,175,202,0.8)' : i % 7 === 0 ? 'rgba(199,146,234,0.7)' : 'rgba(220,230,255,0.7)')
                : 'rgba(80,90,120,0.08)',
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.dur}s`,
              boxShadow: isDark && star.size > 1.2
                ? `0 0 ${star.size * 4}px rgba(0,175,202,0.5), 0 0 ${star.size * 8}px rgba(0,175,202,0.2)`
                : 'none',
            }}
          />
        ))}
      </div>

      {/* Layer 3: Code flow streams — depth: 55px */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={px(55)}>
        {isDark && Array.from({ length: 8 }).map((_, col) => (
          <div
            key={`stream-${col}`}
            className="absolute top-0 animate-vibe-codeflow"
            style={{
              left: `${8 + col * 12}%`,
              width: '1px',
              height: '200%',
              background: `linear-gradient(180deg,
                transparent 0%,
                rgba(0,175,202,0.06) 8%,
                rgba(0,175,202,0.12) 25%,
                transparent 45%,
                rgba(199,146,234,0.08) 65%,
                rgba(199,146,234,0.04) 85%,
                transparent 100%
              )`,
              animationDelay: `${col * 1.8}s`,
              animationDuration: `${10 + col * 2}s`,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>

      {/* Layer 4: Floating code symbols — depth: 70px (moves most) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={px(70)}>
        {CODE_SYMBOLS.map((sym, i) => (
          <span
            key={i}
            className="absolute font-mono animate-vibe-float"
            style={{
              left: `${3 + (i * 3.1) % 94}%`,
              top: `${5 + (i * 5.7) % 90}%`,
              fontSize: `${12 + (i % 3) * 4}px`,
              color: symColors[i % 5],
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${18 + (i % 6) * 3}s`,
              textShadow: isDark ? `0 0 12px ${symColors[i % 5]}, 0 0 24px ${symColors[i % 5]}` : 'none',
            }}
          >
            {sym}
          </span>
        ))}
      </div>

      {/* Layer 5: Dot grid — depth: 15px (subtle, stays more fixed) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          ...px(15),
          backgroundImage: 'radial-gradient(circle, var(--ide-accent) 0.5px, transparent 0.5px)',
          backgroundSize: '48px 48px',
          opacity: isDark ? '0.06' : '0.04',
        }}
      />

      {/* ═══════════════════════════════════════════════════
          CONTENT LAYER
          ═══════════════════════════════════════════════════ */}
      <div className="relative z-10 flex flex-col flex-1 overflow-hidden">
      {/* IDE Header */}
      <div
        className={`flex items-center flex-shrink-0 backdrop-blur-xl ${isMobile ? 'h-8' : 'h-9'}`}
        style={{
          backgroundColor: isDark
            ? 'rgba(13,17,23,0.80)'
            : 'rgba(240,244,248,0.85)',
          borderBottom: '1px solid var(--ide-border)',
        }}
      >
        {/* Activity bar — only on desktop */}
        {isDesktop && (
          <div
            className="flex flex-col items-center w-10 h-full py-1 gap-0.5 backdrop-blur-xl"
            style={{
              backgroundColor: isDark
                ? 'rgba(13,17,23,0.70)'
                : 'rgba(240,244,248,0.75)',
              borderRight: '1px solid var(--ide-border)',
            }}
          >
            <button
              onClick={() => navigate('/')}
              className="w-8 h-7 flex items-center justify-center rounded hover:bg-[var(--ide-hover)] transition-colors"
              title={t('common.home', 'Басты бет')}
            >
              <FontAwesomeIcon
                icon={faCode}
                className="text-[var(--ide-accent)] text-sm"
              />
            </button>
          </div>
        )}

        {/* Title bar */}
        <div className={`flex-1 flex items-center ${isMobile ? 'px-2 gap-0.5' : 'px-3 gap-1'} h-full`}>
          {/* Left actions - Panel toggles */}
          <div className="flex items-center gap-0.5">
            {/* Mobile: hamburger menu to toggle sidebar */}
            {isMobile && (
              <button
                onClick={() => dispatch({ type: 'TOGGLE_LEFT_PANEL' })}
                className={`p-1.5 rounded text-[11px] transition-all duration-200 ${
                  state.leftPanelVisible
                    ? 'text-[var(--ide-accent)] bg-[var(--ide-accent)]/10'
                    : 'text-[var(--ide-text-muted)] hover:text-[var(--ide-text)] hover:bg-[var(--ide-hover)]'
                }`}
                title={t('vibecoding.layout.toggleExplorer')}
              >
                <FontAwesomeIcon icon={faBars} className="text-[11px]" />
              </button>
            )}

            {/* Tablet/Desktop: Explorer toggle */}
            {!isMobile && (
              <button
                onClick={() => dispatch({ type: 'TOGGLE_LEFT_PANEL' })}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-all duration-200 ${
                  state.leftPanelVisible
                    ? 'text-[var(--ide-accent)] bg-[var(--ide-accent)]/10'
                    : 'text-[var(--ide-text-muted)] hover:text-[var(--ide-text)] hover:bg-[var(--ide-hover)]'
                }`}
                title={t('vibecoding.layout.toggleExplorer')}
              >
                <FontAwesomeIcon icon={faFolderTree} className="text-[10px]" />
                {!isMobile && <span className="hidden sm:inline">{t('vibecoding.fileExplorer.title')}</span>}
              </button>
            )}

            <button
              onClick={() => dispatch({ type: 'TOGGLE_BOTTOM_PANEL' })}
              className={`flex items-center gap-1 ${isMobile ? 'p-1.5' : 'px-2 py-1'} rounded text-[11px] transition-all duration-200 ${
                state.bottomPanelVisible
                  ? 'text-[var(--ide-accent)] bg-[var(--ide-accent)]/10'
                  : 'text-[var(--ide-text-muted)] hover:text-[var(--ide-text)] hover:bg-[var(--ide-hover)]'
              }`}
              title={t('vibecoding.layout.toggleTerminal')}
            >
              <FontAwesomeIcon icon={faTerminal} className="text-[10px]" />
              {!isMobile && <span className="hidden sm:inline">{t('vibecoding.terminal.title')}</span>}
            </button>
          </div>

          {/* Center - file info */}
          <div className="flex-1 text-center min-w-0">
            <span className="text-[11px] text-[var(--ide-text-muted)] truncate block">
              {activeFile ? (
                <>
                  <span className="text-[var(--ide-text)] font-medium">{activeFile.name}</span>
                  {activeFile.isDirty && <span className="ml-1 text-[var(--ide-accent)]">●</span>}
                  {!isMobile && <>{' · '}<span>Vibecoding</span></>}
                </>
              ) : (
                'Vibecoding'
              )}
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5">
            {/* Chat toggle */}
            <button
              onClick={() => dispatch({ type: 'TOGGLE_RIGHT_PANEL' })}
              className={`flex items-center gap-1 ${isMobile ? 'p-1.5' : 'px-2 py-1'} rounded text-[11px] transition-all duration-200 ${
                state.rightPanelVisible
                  ? 'text-[var(--ide-accent)] bg-[var(--ide-accent)]/10'
                  : 'text-[var(--ide-text-muted)] hover:text-[var(--ide-text)] hover:bg-[var(--ide-hover)]'
              }`}
              title={t('vibecoding.layout.toggleChat')}
            >
              <FontAwesomeIcon icon={faRobot} className="text-[10px]" />
              {!isMobile && <span className="hidden sm:inline">ЖИ</span>}
            </button>

            {/* Divider */}
            {!isMobile && <div className="w-px h-4 bg-[var(--ide-border)] mx-1" />}

            {/* Theme toggle */}
            {!isMobile && (
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded text-[var(--ide-text-muted)] hover:text-[var(--ide-text)] hover:bg-[var(--ide-hover)] transition-colors"
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              >
                <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} className="text-[10px]" />
              </button>
            )}

            {/* Upload */}
            <button
              onClick={() => navigate('/upload')}
              className="p-1.5 rounded text-[var(--ide-text-muted)] hover:text-[var(--ide-text)] hover:bg-[var(--ide-hover)] transition-colors"
              title={t('vibecoding.layout.upload')}
            >
              <FontAwesomeIcon icon={faUpload} className="text-[10px]" />
            </button>

            {/* Chat link */}
            <button
              onClick={() => navigate('/chat')}
              className="p-1.5 rounded text-[var(--ide-text-muted)] hover:text-[var(--ide-text)] hover:bg-[var(--ide-hover)] transition-colors"
              title={t('header.chat')}
            >
              <FontAwesomeIcon icon={faComments} className="text-[10px]" />
            </button>

            {/* Home */}
            <button
              onClick={() => navigate('/')}
              className="p-1.5 rounded text-[var(--ide-text-muted)] hover:text-[var(--ide-text)] hover:bg-[var(--ide-hover)] transition-colors"
              title={t('common.home')}
            >
              <FontAwesomeIcon icon={faHome} className="text-[10px]" />
            </button>
          </div>
        </div>
      </div>

      {/* IDE Layout */}
      <IDELayout />
      </div>
    </div>
  );
};

const VibecodingPage: React.FC = () => (
  <VibecodingProvider>
    <VibecodingPageInner />
  </VibecodingProvider>
);

export default VibecodingPage;