import React, { useState, useEffect } from 'react';
import SvgIcon from '../SvgIcon';

interface IconLoaderProps {
  src: string; // URL to SVG icon (e.g., from oyji.org)
  size?: string | number;
  className?: string;
  fallback?: React.ReactNode;
  viewBox?: string;
}

/**
 * Component to load and display SVG icons from external sources
 * Supports icons from oyji.org and other SVG sources
 */
const IconLoader: React.FC<IconLoaderProps> = ({
  src,
  size = 24,
  className = '',
  fallback = null,
  viewBox = '0 0 24 24',
}) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const loadSvg = async () => {
      try {
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error('Failed to load SVG');
        }
        const text = await response.text();
        setSvgContent(text);
        setError(false);
      } catch (err) {
        console.error('Error loading SVG icon:', err);
        setError(true);
      }
    };

    if (src) {
      loadSvg();
    }
  }, [src]);

  if (error && fallback) {
    return <>{fallback}</>;
  }

  if (!svgContent) {
    return fallback ? <>{fallback}</> : null;
  }

  // Extract path or content from loaded SVG
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svgElement = svgDoc.querySelector('svg');
  
  if (!svgElement) {
    return fallback ? <>{fallback}</> : null;
  }

  // Extract viewBox if not provided
  const extractedViewBox = viewBox || svgElement.getAttribute('viewBox') || '0 0 24 24';
  
  // Get inner HTML content (paths, circles, etc.)
  const innerHTML = svgElement.innerHTML;

  return (
    <SvgIcon
      viewBox={extractedViewBox}
      width={size}
      height={size}
      className={className}
    >
      <g dangerouslySetInnerHTML={{ __html: innerHTML }} />
    </SvgIcon>
  );
};

export default IconLoader;

