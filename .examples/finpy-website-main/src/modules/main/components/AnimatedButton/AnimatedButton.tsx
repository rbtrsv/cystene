import React from 'react';
import './AnimatedButton.css';

interface AnimatedButtonProps {
  text: string;
  className?: string;
  type?: 'submit' | 'button' | 'reset';
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  text,
  className,
  type,
}) => {
  return (
    <button
      type={type || 'button'}
      className={`button rounded-full ${className}`}
    >
      <span className='button-background'></span>
      <span className={`button-text ${className}`}>{text}</span>
    </button>
  );
};

export default AnimatedButton;
