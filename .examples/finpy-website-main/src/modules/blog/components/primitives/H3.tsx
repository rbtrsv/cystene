import React from 'react';

interface H3Props {
  children: React.ReactNode;
  className?: string;
}

const H3: React.FC<H3Props> = ({ children, className = "" }) => (
  <h3 className={`text-xl font-medium my-2 ${className}`}>{children}</h3>
);

export default H3;
