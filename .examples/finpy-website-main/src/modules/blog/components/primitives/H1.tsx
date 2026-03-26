import React from 'react';

interface H1Props extends React.HTMLProps<HTMLHeadingElement> {}

const H1: React.FC<H1Props> = ({ children, className = "", ...props }) => {
  return (
    <h1 
      className={`bg-linear-to-br from-[#c517ff] to-[#2631f7] bg-clip-text text-transparent text-center text-xl md:text-2xl lg:text-3xl font-semibold my-4 dark:text-white! text-black! ${className}`} 
      {...props}
    >
      {children}
    </h1>
  );
};


export default H1;
