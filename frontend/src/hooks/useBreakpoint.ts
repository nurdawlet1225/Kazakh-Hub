import { useState, useEffect, useCallback } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface BreakpointInfo {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

const BREAKPOINTS = {
  mobile: 768,   // < 768px: overlay panels, compact UI
  tablet: 1024,  // 768-1024px: sidebar/chat overlay, icon-only activity bar
  // > 1024px: full 3-panel layout
} as const;

export function useBreakpoint(): BreakpointInfo {
  const getWidth = useCallback(() => window.innerWidth, []);

  const getBreakpoint = useCallback((width: number): Breakpoint => {
    if (width < BREAKPOINTS.mobile) return 'mobile';
    if (width < BREAKPOINTS.tablet) return 'tablet';
    return 'desktop';
  }, []);

  const [width, setWidth] = useState(() => getWidth());
  const [breakpoint, setBreakpoint] = useState(() => getBreakpoint(getWidth()));

  useEffect(() => {
    let rafId: number;

    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const newWidth = getWidth();
        const newBreakpoint = getBreakpoint(newWidth);
        setWidth(newWidth);
        setBreakpoint(newBreakpoint);
      });
    };

    // Use matchMedia for efficient breakpoint transitions
    const mobileQuery = window.matchMedia(`(max-width: ${BREAKPOINTS.mobile - 1}px)`);
    const tabletQuery = window.matchMedia(
      `(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`
    );

    const handleChange = () => {
      handleResize();
    };

    mobileQuery.addEventListener('change', handleChange);
    tabletQuery.addEventListener('change', handleChange);
    window.addEventListener('resize', handleResize);

    // Initial check
    handleResize();

    return () => {
      cancelAnimationFrame(rafId);
      mobileQuery.removeEventListener('change', handleChange);
      tabletQuery.removeEventListener('change', handleChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [getBreakpoint, getWidth]);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    width,
  };
}