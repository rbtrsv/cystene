import { useEffect, useState } from 'react';

// HydrationZustand is a component that delays the rendering of its children until Next.js has completed rehydration.
// This is necessary to prevent inconsistencies between server-rendered and client-rendered content, which is a common issue in SSR frameworks like Next.js.
const HydrationZustand = ({ children }) => {
  const [isHydrated, setIsHydrated] = useState(false); // State to track whether hydration is complete

  // The useEffect hook is used to set isHydrated to true on component mount, indicating that rehydration is complete.
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Children are rendered only after rehydration is complete, preventing hydration mismatches.
  return <>{isHydrated ? <div>{children}</div> : null}</>;
};

export default HydrationZustand;
