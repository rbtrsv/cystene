'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const CopyButton = ({ code }: { code: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <button
      className="absolute top-2 right-2 p-1 rounded-md bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 focus:outline-hidden transition-colors duration-200"
      onClick={handleCopy}
    >
      {isCopied ? (
        <Check size={14} className="text-zinc-600 dark:text-zinc-300" />
      ) : (
        <Copy size={14} className="text-zinc-600 dark:text-zinc-300" />
      )}
    </button>
  );
};

export default CopyButton;
