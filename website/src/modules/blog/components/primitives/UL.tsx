import React from 'react';

interface ULProps {
  children: React.ReactNode;
  className?: string;
}

const UL: React.FC<ULProps> = ({ children, className = '' }) => {
  return <ul className={`list-disc pl-5 pt-2 ${className}`}>{children}</ul>;
};

export default UL;