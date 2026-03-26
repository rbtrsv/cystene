'use client';

import { useContext } from 'react';
import { GeneContext, GeneContextType } from '@/modules/nexotype/providers/omics/gene-provider';
import { useGeneStore } from '@/modules/nexotype/store/omics/gene.store';
import {
  type Gene,
  type CreateGene,
  type UpdateGene,
} from '@/modules/nexotype/schemas/omics/gene.schemas';
import { ListGenesParams } from '@/modules/nexotype/service/omics/gene.service';

/**
 * Hook to use the gene context
 * @throws Error if used outside of a GeneProvider
 */
export function useGeneContext(): GeneContextType {
  const context = useContext(GeneContext);

  if (!context) {
    throw new Error('useGeneContext must be used within a GeneProvider');
  }

  return context;
}

/**
 * Custom hook that combines gene context and store
 * to provide a simplified interface for gene functionality
 *
 * @returns Gene utilities and state
 */
export function useGenes() {
  // Get data from gene context
  const {
    genes,
    activeGeneId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveGene,
    clearError: clearContextError,
  } = useGeneContext();

  // Get additional actions from gene store
  const {
    fetchGenes,
    fetchGene,
    createGene,
    updateGene,
    deleteGene,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useGeneStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active gene
  const activeGene = genes.find(
    (gene: Gene) => gene.id === activeGeneId
  ) || null;

  return {
    // State
    genes,
    activeGeneId,
    activeGene,
    isLoading,
    error,
    isInitialized,

    // Gene actions
    fetchGenes,
    fetchGene,
    createGene,
    updateGene,
    deleteGene,
    setActiveGene,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return genes.find((gene: Gene) => gene.id === id);
    },
    getByName: (id: number) => {
      const gene = genes.find((g: Gene) => g.id === id);
      return gene ? gene.hgnc_symbol : 'Unknown Gene';
    },
    getByHgncSymbol: (hgncSymbol: string) => {
      return genes.find((g: Gene) => g.hgnc_symbol === hgncSymbol);
    },
    getByEnsemblGeneId: (ensemblGeneId: string) => {
      return genes.find((g: Gene) => g.ensembl_gene_id === ensemblGeneId);
    },
    getByOrganismId: (organismId: number) => {
      return genes.filter((g: Gene) => g.organism_id === organismId);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListGenesParams) => {
      return await fetchGenes(filters);
    },
    createWithData: async (data: CreateGene) => {
      return await createGene(data);
    },
    updateWithData: async (id: number, data: UpdateGene) => {
      return await updateGene(id, data);
    },
  };
}

export default useGenes;
