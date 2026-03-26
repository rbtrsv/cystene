'use client';

import { HyperText } from '@/modules/shadcnui/components/ui/hyper-text';

export default function DashboardPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <HyperText
        className="text-4xl font-bold tracking-tight text-foreground"
        startOnView={true}
        animateOnHover={true}
        characterSet={['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']}
      >
        V7 Capital Core
      </HyperText>
    </div>
  );
}
