import React from 'react';

interface TextProps extends React.HTMLProps<HTMLParagraphElement> {}

const Text: React.FC<TextProps> = ({ children, ...props }) => (
  <p className="my-2 font-normal max-sm:text-sm sm:text-base dark:text-white text-black" {...props}>
    {children}
  </p>
);

export default Text;