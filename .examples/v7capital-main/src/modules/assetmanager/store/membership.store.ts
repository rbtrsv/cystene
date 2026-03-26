import { create } from 'zustand';
import type { Company } from '@/modules/assetmanager/schemas/companies.schemas';
import type { Stakeholder } from '@/modules/assetmanager/schemas/stakeholders.schemas';

export interface MembershipState {
  companies: Company[];
  stakeholders: Stakeholder[];
  setCompanies: (companies: Company[]) => void;
  setStakeholders: (stakeholders: Stakeholder[]) => void;
  resetMembership: () => void;
}

export const useMembershipStore = create<MembershipState>((set) => ({
  companies: [],
  stakeholders: [],
  setCompanies: (companies) => set({ companies }),
  setStakeholders: (stakeholders) => set({ stakeholders }),
  resetMembership: () => set({ companies: [], stakeholders: [] }),
}));
