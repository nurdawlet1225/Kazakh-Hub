import React from 'react';
import SvgIcon from '../SvgIcon';

interface HomeIconProps {
  size?: string | number;
  className?: string;
  fill?: string;
}

const HomeIcon: React.FC<HomeIconProps> = ({ 
  size = 24, 
  className = '',
  fill = 'currentColor' 
}) => {
  return (
    <SvgIcon
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill={fill}
    >
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </SvgIcon>
  );
};

export default HomeIcon;









