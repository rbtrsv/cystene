'use client';

import { useContext, useCallback } from 'react';
import { EntityContext, EntityContextType } from '../../providers/entity/entity-provider';
import { useEntityStore } from '../../store/entity/entity.store';
import {
  type Entity,
  type CreateEntity,
  type UpdateEntity,
  type EntityType
} from '../../schemas/entity/entity.schemas';
import { ListEntitiesParams } from '../../service/entity/entity.service';

/**
 * Hook to use the entity context
 * @throws Error if used outside of an EntityProvider
 */
export function useEntityContext(): EntityContextType {
  const context = useContext(EntityContext);

  if (!context) {
    throw new Error('useEntityContext must be used within an EntityProvider');
  }

  return context;
}

/**
 * Custom hook that combines entity context and store
 * to provide a simplified interface for entity functionality
 *
 * @returns Entity utilities and state
 */
export function useEntities() {
  // Get data from entity context
  const {
    entities,
    activeEntityId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveEntity,
    clearError: clearContextError
  } = useEntityContext();

  // Get additional actions from entity store
  const {
    fetchEntities,
    fetchEntity,
    createEntity,
    updateEntity,
    deleteEntity,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useEntityStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active entity
  const activeEntity = entities.find((entity: Entity) => entity.id === activeEntityId) || null;

  return {
    // State
    entities,
    activeEntityId,
    activeEntity,
    isLoading,
    error,
    isInitialized,

    // Entity actions
    fetchEntities,
    fetchEntity,
    createEntity,
    updateEntity,
    deleteEntity,
    setActiveEntity,
    initialize,
    clearError,

    // Helper methods — memoized so they can be used in useMemo dependency arrays
    getEntityById: useCallback((id: number) => {
      return entities.find((entity: Entity) => entity.id === id);
    }, [entities]),
    getEntityName: useCallback((id: number) => {
      const entity = entities.find((e: Entity) => e.id === id);
      return entity ? entity.name : 'Unknown Entity';
    }, [entities]),
    getEntitiesByType: useCallback((entityType: EntityType) => {
      return entities.filter((e: Entity) => e.entity_type === entityType);
    }, [entities]),
    getEntitiesByOrganization: useCallback((organizationId: number) => {
      return entities.filter((e: Entity) => e.organization_id === organizationId);
    }, [entities]),
    getChildEntities: useCallback((parentId: number) => {
      return entities.filter((e: Entity) => e.parent_id === parentId);
    }, [entities]),

    // Convenience wrapper functions
    fetchEntitiesWithFilters: async (filters: ListEntitiesParams) => {
      return await fetchEntities(filters);
    },
    createEntityWithData: async (data: CreateEntity) => {
      return await createEntity(data);
    },
    updateEntityWithData: async (id: number, data: UpdateEntity) => {
      return await updateEntity(id, data);
    }
  };
}

export default useEntities;
