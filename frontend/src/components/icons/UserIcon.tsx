import React from 'react';
import SvgIcon from '../SvgIcon';

interface UserIconProps {
  size?: string | number;
  className?: string;
  fill?: string;
}

const UserIcon: React.FC<UserIconProps> = ({ 
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
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </SvgIcon>
  );
};

export default UserIcon;









