import React from 'react';

// Simple section component for text-only content
interface SimpleSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const SimpleSection: React.FC<SimpleSectionProps> = ({
  title,
  children,
  className = ''
}) => {
  return (
    <section className={`py-6 sm:py-8 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-700">
          <div className="space-y-4">
            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {title}
            </h2>

            {/* Content */}
            <div className="prose prose-zinc dark:prose-invert max-w-none">
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SimpleSection;