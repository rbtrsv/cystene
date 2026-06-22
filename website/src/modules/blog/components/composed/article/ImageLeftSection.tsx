import React from 'react';
import Image from 'next/image';

// Internal subcomponents for AdaptableSection
interface TimeIndicatorProps {
  time: string;
  color?: 'yellow' | 'green' | 'blue' | 'purple' | 'orange';
  className?: string;
}

const TimeIndicator: React.FC<TimeIndicatorProps> = ({ 
  time, 
  color = 'yellow', 
  className = '' 
}) => {
  const colorClasses = {
    yellow: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-300 dark:text-yellow-900',
    green: 'bg-green-200 text-green-800 dark:bg-green-300 dark:text-green-900', 
    blue: 'bg-blue-200 text-blue-800 dark:bg-blue-300 dark:text-blue-900',
    purple: 'bg-purple-200 text-purple-800 dark:bg-purple-300 dark:text-purple-900',
    orange: 'bg-orange-200 text-orange-800 dark:bg-orange-300 dark:text-orange-900'
  };

  return (
    <span 
      className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${colorClasses[color]} ${className}`}
    >
      {time}
    </span>
  );
};

interface CategoryProps {
  label: string;
  variant?: 'energy' | 'health' | 'performance' | 'supplements' | 'default';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Category: React.FC<CategoryProps> = ({ 
  label, 
  variant = 'default',
  size = 'md',
  className = '' 
}) => {
  const variantClasses = {
    energy: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
    health: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
    performance: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800', 
    supplements: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
    default: 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm', 
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span 
      className={`inline-flex items-center rounded-full border font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {label}
    </span>
  );
};

// Main ImageLeftSection component - always has image on left, content on right
interface ImageLeftSectionProps {
  imageUrl: string;
  imageAlt: string;
  timeIndicator?: string;
  timeColor?: 'yellow' | 'green' | 'blue' | 'purple' | 'orange';
  title: string;
  children: React.ReactNode;
  className?: string;
}

const ImageLeftSection: React.FC<ImageLeftSectionProps> = ({
  imageUrl,
  imageAlt,
  timeIndicator,
  timeColor = 'yellow',
  title,
  children,
  className = ''
}) => {
  
  return (
    <section className={`py-6 sm:py-8 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
          {/* Left side - Image */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="relative">
              <div className="aspect-square overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src={imageUrl}
                  alt={imageAlt}
                  width={400}
                  height={400}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  priority={false}
                />
              </div>
            </div>
          </div>

          {/* Right side - Content */}
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-700">
              <div className="space-y-4">
                {/* Time Indicator */}
                {timeIndicator && (
                  <div className="flex justify-start">
                    <TimeIndicator time={timeIndicator} color={timeColor} />
                  </div>
                )}

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
        </div>
      </div>
    </section>
  );
};

// Export the main component and subcomponents for potential external use
export default ImageLeftSection;
export { TimeIndicator, Category };