// Importing necessary functions and types from Zustand and its middleware
import { create, StateCreator } from 'zustand';
import { createJSONStorage, persist, PersistOptions } from 'zustand/middleware';

// Interface defining the shape of the sidebar's state
interface SidebarState {
  isCollapsed: boolean; // State to track if the sidebar is collapsed
  setIsCollapsed: (collapsed: boolean) => void; // Setter function to update the isCollapsed state
}

// Custom type for persist middleware to handle TypeScript type issues
// This workaround is necessary due to TypeScript's strict type checking.
type MyPersist = (
  config: StateCreator<SidebarState>,
  options: PersistOptions<SidebarState>
) => StateCreator<SidebarState>;

// Creating a Zustand store with persist middleware
// The store manages the state of the sidebar, including its collapsed status.
// Persist middleware enables the state to be stored in localStorage, allowing it to persist across sessions.
export const useSidebarStore = create<SidebarState, []>(
  (persist as unknown as MyPersist)(
    (set) => ({
      isCollapsed: false, // Initial state
      setIsCollapsed: (collapsed) => set({ isCollapsed: collapsed }), // Setter method
    }),
    {
      name: 'sidebar-storage', // Unique key for localStorage
      storage: createJSONStorage(() => localStorage), // Specifying localStorage for storage
    }
  )
);
