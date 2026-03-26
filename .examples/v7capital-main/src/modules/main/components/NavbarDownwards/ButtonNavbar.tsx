import React from 'react';

interface Props {
  children: React.ReactNode;
}

const Button: React.FC<Props> = ({ children }) => {
  return (
    <button className='rounded bg-indigo-600 px-6 py-2 font-[Poppins] text-white duration-500 hover:bg-indigo-400 md:ml-8'>
      {children}
    </button>
  );
};

export default Button;
