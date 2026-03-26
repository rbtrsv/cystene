import React from 'react';

interface OLProps {
  children: React.ReactNode;
  className?: string;
}

const OL: React.FC<OLProps> = ({ children, className = '' }) => {
  return <ol className={`list-decimal pl-5 ${className}`}>{children}</ol>;
};

export default OL;