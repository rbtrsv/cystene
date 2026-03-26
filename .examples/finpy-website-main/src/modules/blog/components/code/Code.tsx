import React from 'react';
import { codeToHtml } from './shiki';
import CopyButton from './CopyButton';
import './ShikiStyles.css';

interface CodeProps {
  code: string;
  language?: string;
}

// This component is marked as async, which means it can use await inside
// This is a feature of React Server Components
const Code: React.FC<CodeProps> = async ({ code, language = 'python' }) => {
  // Because this component is async, this await will happen on the server
  // The highlighted HTML is generated before the component is sent to the client
  const highlightedCode = await codeToHtml(code, language);

  // The component returns a div with the highlighted code inside
  // This HTML is generated on the server and sent to the client already highlighted
  return (
    <div className="not-prose max-sm:py-3 py-5">
      <div className="relative">
        <div
          className="font-mono font-normal max-sm:text-xs sm:text-sm overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
        <CopyButton code={code} />
      </div>
    </div>
  );
};

export default Code;