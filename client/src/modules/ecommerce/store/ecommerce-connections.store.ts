'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Connection,
  CreateConnection,
  UpdateConnection,
  ConnectionTestResponse,
} from '../schemas/ecommerce-connections.schemas';
import {
  getConnections,
  getConnection,
  createConnection as apiCreateConnection,
  updateConnection as apiUpdateConnection,
  deleteConnection as apiDeleteConnection,
  testConnection as apiTestConnection,
} from '../service/ecommerce-connections.service';

/**
 * Connection store state interface
 */
export interface ConnectionState {
  // State
  connections: Connection[];
  activeConnectionId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchConnections: () => Promise<boolean>;
  fetchConnection: (id: number) => Promise<Connection | null>;
  createConnection: (data: CreateConnection) => Promise<boolean>;
  updateConnection: (id: number, data: UpdateConnection) => Promise<boolean>;
  deleteConnection: (id: number) => Promise<boolean>;
  testConnection: (id: number) => Promise<ConnectionTestResponse>;
  setActiveConnection: (connectionId: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create connection store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 * Uses persist middleware to remember activeConnectionId across sessions
 */
export const useConnectionStore = create<ConnectionState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        connections: [],
        activeConnectionId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize connections state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getConnections();

            if (response.success && response.data) {
              set((state) => {
                state.connections = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;

                // Set active connection if not already set and connections exist
                if (response.data && response.data.length > 0 && state.activeConnectionId === null) {
                  state.activeConnectionId = response.data[0].id;
                }
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize connections',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize connections',
            });
          }
        },

        /**
         * Fetch all connections
         * @returns Success status
         */
        fetchConnections: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getConnections();

            if (response.success && response.data) {
              set((state) => {
                state.connections = response.data || [];
                state.isLoading = false;

                // Set active connection if not already set
                if (response.data && response.data.length > 0 && state.activeConnectionId === null) {
                  state.activeConnectionId = response.data[0].id;
                }
              });
              return true;
            } else {
              set({
                isLoading: false,
                error: response.error || 'Failed to fetch connections',
              });
              return false;
            }
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return false;
          }
        },

        /**
         * Fetch a specific connection by ID
         * @param id Connection ID
         * @returns Promise with connection or null
         */
        fetchConnection: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getConnection(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            } else {
              set({
                isLoading: false,
                error: response.error || `Failed to fetch connection with ID ${id}`,
              });
              return null;
            }
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return null;
          }
        },

        /**
         * Create a new connection
         * @param data Connection creation data
         * @returns Success status
         */
        createConnection: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateConnection(data);

            if (response.success && response.data) {
              // After creating, refresh connections list
              await get().fetchConnections();

              set((state) => {
                state.isLoading = false;

                // Set as active connection if it's the first one
                if (state.connections.length === 1 && response.data) {
                  state.activeConnectionId = response.data.id;
                }
              });
              return true;
            } else {
              set({
                isLoading: false,
                error: response.error || 'Failed to create connection',
              });
              return false;
            }
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return false;
          }
        },

        /**
         * Update an existing connection
         * @param id Connection ID
         * @param data Connection update data
         * @returns Success status
         */
        updateConnection: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateConnection(id, data);

            if (response.success && response.data) {
              // After updating, refresh connections list
              await get().fetchConnections();

              set({ isLoading: false });
              return true;
            } else {
              set({
                isLoading: false,
                error: response.error || `Failed to update connection with ID ${id}`,
              });
              return false;
            }
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return false;
          }
        },

        /**
         * Delete a connection
         * @param id Connection ID
         * @returns Success status
         */
        deleteConnection: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteConnection(id);

            if (response.success) {
              // Clear active connection if it's the one being deleted
              set((state) => {
                if (state.activeConnectionId === id) {
                  state.activeConnectionId = null;
                }
              });

              // After deleting, refresh connections list
              await get().fetchConnections();

              set((state) => {
                // Set new active connection if we don't have one
                if (state.activeConnectionId === null && state.connections.length > 0) {
                  state.activeConnectionId = state.connections[0].id;
                }
                state.isLoading = false;
              });
              return true;
            } else {
              set({
                isLoading: false,
                error: response.error || `Failed to delete connection with ID ${id}`,
              });
              return false;
            }
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return false;
          }
        },

        /**
         * Test a connection's database connectivity
         * @param id Connection ID
         * @returns Connection test response
         */
        testConnection: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiTestConnection(id);
            set({ isLoading: false });

            if (!response.success) {
              set({ error: response.message });
            }

            return response;
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return {
              success: false,
              message: error instanceof Error ? error.message : 'An unexpected error occurred',
            };
          }
        },

        /**
         * Set active connection
         * @param connectionId ID of the active connection or null
         */
        setActiveConnection: (connectionId) => {
          set((state) => {
            state.activeConnectionId = connectionId;
          });
        },

        /**
         * Clear error message
         */
        clearError: () => {
          set({ error: null });
        },

        /**
         * Reset connection state to initial values
         */
        reset: () => {
          set({
            connections: [],
            activeConnectionId: null,
            isLoading: false,
            error: null,
            isInitialized: true,
          });
        },
      })),
      {
        name: 'nudgio-connections-storage',
        partialize: (state) => ({
          activeConnectionId: state.activeConnectionId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Get active connection from connection store
 * @returns The active connection or undefined if not set
 */
export const getActiveConnection = (): Connection | undefined => {
  const { connections, activeConnectionId } = useConnectionStore.getState();
  return connections.find((conn) => conn.id === activeConnectionId);
};
