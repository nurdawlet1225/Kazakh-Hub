import React from 'react';

interface SvgIconProps {
  viewBox?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  fill?: string;
  stroke?: string;
  strokeWidth?: string | number;
}

/**
 * Reusable SVG Icon component with proper W3C SVG namespace
 * Supports SVG icons from various sources including oyji.org
 */
const SvgIcon: React.FC<SvgIconProps> = ({
  viewBox = '0 0 24 24',
  width = 24,
  height = 24,
  className = '',
  style = {},
  children,
  fill = 'currentColor',
  stroke,
  strokeWidth,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={width}
      height={height}
      className={className}
      style={style}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
};

export default SvgIcon;





