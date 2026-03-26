import React, { ReactNode } from 'react';
import NavbarDownwards from '@/modules/main/components/NavbarDownwards/NavbarDownwards';
import Footer from '@/modules/main/components/Footer/Footer';

interface ArticleLayoutProps {
  children: ReactNode;
}

const ArticleLayout: React.FC<ArticleLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <NavbarDownwards />
      <main className="grow bg-white dark:bg-black pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-8 sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <article className="prose prose-zinc dark:prose-invert max-w-none">
              {children}
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ArticleLayout;
