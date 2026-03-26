import React from 'react';
import Link from 'next/link';

interface LinkComponentProps {
  href: string;
  children: React.ReactNode;
}

const LinkComponent: React.FC<LinkComponentProps> = ({ href, children }) => (
  <Link href={href} className="text-blue-500 hover:underline">
    {children}
  </Link>
);

export default LinkComponent;
