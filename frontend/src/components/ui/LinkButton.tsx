import React from 'react';
import { Link } from 'react-router-dom';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary';

export interface LinkButtonProps {
  variant?: ButtonVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  to: string;
  className?: string;
  title?: string;
  onClick?: () => void;
}

const LinkButton: React.FC<LinkButtonProps> = ({
  variant = 'primary',
  children,
  icon,
  fullWidth = false,
  to,
  className = '',
  title,
  onClick,
}) => {
  const buttonClasses = [
    'btn',
    `btn-${variant}`,
    fullWidth && 'btn-full-width',
    className
  ].filter(Boolean).join(' ');

  return (
    <Link
      to={to}
      className={buttonClasses}
      title={title}
      onClick={onClick}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {children && <span className="btn-text">{children}</span>}
    </Link>
  );
};

export default LinkButton;

