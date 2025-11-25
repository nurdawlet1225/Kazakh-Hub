import React from 'react';
import SvgIcon from '../SvgIcon';

interface UploadIconProps {
  size?: string | number;
  className?: string;
  fill?: string;
}

const UploadIcon: React.FC<UploadIconProps> = ({ 
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
      <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
    </SvgIcon>
  );
};

export default UploadIcon;

