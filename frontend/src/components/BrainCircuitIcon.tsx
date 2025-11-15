import React from 'react';

interface BrainCircuitIconProps {
  className?: string;
  size?: number;
}

const BrainCircuitIcon: React.FC<BrainCircuitIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Brain part - left side with characteristic folds */}
      <path
        d="M5 6C5 6 4.5 7 5 8.5C5.5 10 6 10.5 6.5 11.5C7 12.5 7.5 13.5 8 14.5C8.5 15.5 9 16.5 9.5 17.5C10 18.5 10.5 19.5 11 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M6 5C6 5 5.5 6.5 6 8C6.5 9.5 7 10 7.5 11C8 12 8.5 13 9 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M7 7C7 7 6.5 8 7 9.5C7.5 11 8 11.5 8.5 12.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M5.5 9C5.5 9 5 10 5.5 11.5C6 13 6.5 13.5 7 14.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Transition line connecting brain to circuit */}
      <line
        x1="11"
        y1="12"
        x2="13"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* Circuit board part - right side */}
      {/* Central vertical line */}
      <line
        x1="13"
        y1="5"
        x2="13"
        y2="19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      
      {/* Top horizontal branch */}
      <line
        x1="13"
        y1="7"
        x2="20"
        y2="7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="7" r="1.8" fill="currentColor" />
      
      {/* Middle horizontal branch */}
      <line
        x1="13"
        y1="12"
        x2="20"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="12" r="1.8" fill="currentColor" />
      
      {/* Bottom horizontal branch */}
      <line
        x1="13"
        y1="17"
        x2="20"
        y2="17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="17" r="1.8" fill="currentColor" />
      
      {/* Diagonal branches - top */}
      <line
        x1="13"
        y1="9"
        x2="18"
        y2="5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="18" cy="5" r="1.4" fill="currentColor" />
      
      {/* Diagonal branches - middle-top */}
      <line
        x1="13"
        y1="10.5"
        x2="18"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="18" cy="8" r="1.4" fill="currentColor" />
      
      {/* Diagonal branches - bottom */}
      <line
        x1="13"
        y1="14.5"
        x2="18"
        y2="16.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="18" cy="16.5" r="1.4" fill="currentColor" />
    </svg>
  );
};

export default BrainCircuitIcon;

