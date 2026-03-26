'use client';

import { ReactNode } from 'react';

// Shared providers
import { PermissionsProvider } from './shared/permissions-provider';
import { usePermissions } from '../hooks/shared/use-permissions';

// Standardization providers
import { OntologyTermProvider } from './standardization/ontology-term-provider';
import { ExternalReferenceProvider } from './standardization/external-reference-provider';
import { UnitOfMeasureProvider } from './standardization/unit-of-measure-provider';

// Omics providers
import { OrganismProvider } from './omics/organism-provider';
import { GeneProvider } from './omics/gene-provider';
import { TranscriptProvider } from './omics/transcript-provider';
import { ExonProvider } from './omics/exon-provider';
import { ProteinProvider } from './omics/protein-provider';
import { ProteinDomainProvider } from './omics/protein-domain-provider';
import { VariantProvider } from './omics/variant-provider';
import { PeptideFragmentProvider } from './omics/peptide-fragment-provider';

// Clinical providers
import { IndicationProvider } from './clinical/indication-provider';
import { PhenotypeProvider } from './clinical/phenotype-provider';
import { BiomarkerProvider } from './clinical/biomarker-provider';
import { PathwayProvider } from './clinical/pathway-provider';

// Asset providers
import { TherapeuticAssetProvider } from './asset/therapeutic-asset-provider';
import { SmallMoleculeProvider } from './asset/small-molecule-provider';
import { BiologicProvider } from './asset/biologic-provider';
import { TherapeuticPeptideProvider } from './asset/therapeutic-peptide-provider';
import { OligonucleotideProvider } from './asset/oligonucleotide-provider';
import { CandidateProvider } from './engineering/candidate-provider';
import { ConstructProvider } from './engineering/construct-provider';
import { DesignMutationProvider } from './engineering/design-mutation-provider';
import { SubjectProvider } from './lims/subject-provider';
import { BiospecimenProvider } from './lims/biospecimen-provider';
import { AssayProtocolProvider } from './lims/assay-protocol-provider';
import { AssayRunProvider } from './lims/assay-run-provider';
import { AssayReadoutProvider } from './lims/assay-readout-provider';
import { UserProfileProvider } from './user/user-profile-provider';
import { DataSourceProvider } from './user/data-source-provider';
import { GenomicFileProvider } from './user/genomic-file-provider';
import { UserVariantProvider } from './user/user-variant-provider';
import { UserBiomarkerReadingProvider } from './user/user-biomarker-reading-provider';
import { UserTreatmentLogProvider } from './user/user-treatment-log-provider';
import { PathwayScoreProvider } from './user/pathway-score-provider';
import { RecommendationProvider } from './user/recommendation-provider';

// Knowledge Graph providers
import { PathwayMembershipProvider } from './knowledge_graph/pathway-membership-provider';
import { BiologicalRelationshipProvider } from './knowledge_graph/biological-relationship-provider';
import { SourceProvider } from './knowledge_graph/source-provider';
import { EvidenceAssertionProvider } from './knowledge_graph/evidence-assertion-provider';
import { ContextAttributeProvider } from './knowledge_graph/context-attribute-provider';
import { DrugTargetMechanismProvider } from './knowledge_graph/drug-target-mechanism-provider';
import { BioactivityProvider } from './knowledge_graph/bioactivity-provider';
import { TherapeuticEfficacyProvider } from './knowledge_graph/therapeutic-efficacy-provider';
import { DrugInteractionProvider } from './knowledge_graph/drug-interaction-provider';
import { BiomarkerAssociationProvider } from './knowledge_graph/biomarker-association-provider';
import { GenomicAssociationProvider } from './knowledge_graph/genomic-association-provider';
import { VariantPhenotypeProvider } from './knowledge_graph/variant-phenotype-provider';

// Commercial providers
import { MarketOrganizationProvider } from './commercial/market-organization-provider';
import { PatentProvider } from './commercial/patent-provider';
import { PatentClaimProvider } from './commercial/patent-claim-provider';
import { PatentAssigneeProvider } from './commercial/patent-assignee-provider';
import { AssetOwnershipProvider } from './commercial/asset-ownership-provider';
import { TransactionProvider } from './commercial/transaction-provider';
import { LicensingAgreementProvider } from './commercial/licensing-agreement-provider';
import { DevelopmentPipelineProvider } from './commercial/development-pipeline-provider';
import { RegulatoryApprovalProvider } from './commercial/regulatory-approval-provider';
import { TechnologyPlatformProvider } from './commercial/technology-platform-provider';
import { AssetTechnologyPlatformProvider } from './commercial/asset-technology-platform-provider';
import { OrganizationTechnologyPlatformProvider } from './commercial/organization-technology-platform-provider';

/**
 * NexotypeProviders props
 */
interface NexotypeProvidersProps {
  children: ReactNode;
}

/**
 * Inner component that reads permissions and conditionally initializes
 * domain providers based on the user's subscription tier.
 *
 * Uses the usePermissions() hook (available because PermissionsProvider
 * wraps this component). Each provider gets initialFetch={canRead(domain)}
 * so only accessible domains make API calls on mount.
 *
 * This eliminates 403 console errors from providers trying to fetch
 * data the user's tier doesn't have access to.
 */
function GatedProviders({ children }: { children: ReactNode }) {
  const { canRead, isInitialized } = usePermissions();

  // While permissions are loading, don't fetch any domain data yet.
  // Once permissions arrive, providers with canRead=true will initialize.
  const ready = isInitialized;

  // Domain-level access (used for entities without overrides)
  const standardization = ready && canRead('standardization');
  const omics = ready && canRead('omics');
  const clinical = ready && canRead('clinical');
  const asset = ready && canRead('asset');
  const engineering = ready && canRead('engineering');
  const lims = ready && canRead('lims');
  const user = ready && canRead('user');
  const knowledgeGraph = ready && canRead('knowledge_graph');
  const commercial = ready && canRead('commercial');

  // Entity-level overrides (these differ from their domain default)
  const gene = ready && canRead('omics', 'gene');
  const variant = ready && canRead('omics', 'variant');
  const biomarker = ready && canRead('clinical', 'biomarker');
  const pathway = ready && canRead('clinical', 'pathway');
  const drugInteraction = ready && canRead('knowledge_graph', 'drug_interaction');
  const genomicAssociation = ready && canRead('knowledge_graph', 'genomic_association');
  const subject = ready && canRead('lims', 'subject');

  return (
    <MarketOrganizationProvider initialFetch={commercial}>
      <TherapeuticAssetProvider initialFetch={asset}>
        <IndicationProvider initialFetch={clinical}>
          <PatentProvider initialFetch={commercial}>
            <PathwayProvider initialFetch={pathway}>
              <PhenotypeProvider initialFetch={clinical}>
                <BiomarkerProvider initialFetch={biomarker}>
                  <OrganismProvider initialFetch={omics}>
                    <GeneProvider initialFetch={gene}>
                      <TranscriptProvider initialFetch={omics}>
                        <ProteinProvider initialFetch={omics}>
                          <ExonProvider initialFetch={omics}>
                            <ProteinDomainProvider initialFetch={omics}>
                              <VariantProvider initialFetch={variant}>
                                <PeptideFragmentProvider initialFetch={omics}>
                                  <SmallMoleculeProvider initialFetch={asset}>
                                    <BiologicProvider initialFetch={asset}>
                                      <TherapeuticPeptideProvider initialFetch={asset}>
                                        <OligonucleotideProvider initialFetch={asset}>
                                          <CandidateProvider initialFetch={engineering}>
                                            <ConstructProvider initialFetch={engineering}>
                                              <DesignMutationProvider initialFetch={engineering}>
                                                <SubjectProvider initialFetch={subject}>
                                                  <BiospecimenProvider initialFetch={lims}>
                                                    <AssayProtocolProvider initialFetch={lims}>
                                                      <AssayRunProvider initialFetch={lims}>
                                                        <AssayReadoutProvider initialFetch={lims}>
                                                          <UserProfileProvider initialFetch={user}>
                                                            <DataSourceProvider initialFetch={user}>
                                                              <GenomicFileProvider initialFetch={user}>
                                                                <UserVariantProvider initialFetch={user}>
                                                                  <UserBiomarkerReadingProvider initialFetch={user}>
                                                                    <UserTreatmentLogProvider initialFetch={user}>
                                                                      <PathwayScoreProvider initialFetch={user}>
                                                                        <RecommendationProvider initialFetch={user}>
                                                                          <OntologyTermProvider initialFetch={standardization}>
                                                                            <PathwayMembershipProvider initialFetch={knowledgeGraph}>
                                                                              <BiologicalRelationshipProvider initialFetch={knowledgeGraph}>
                                                                                <SourceProvider initialFetch={knowledgeGraph}>
                                                                                  <EvidenceAssertionProvider initialFetch={knowledgeGraph}>
                                                                                    <ContextAttributeProvider initialFetch={knowledgeGraph}>
                                                                                      <ExternalReferenceProvider initialFetch={standardization}>
                                                                                        <UnitOfMeasureProvider initialFetch={standardization}>
                                                                                          <DrugTargetMechanismProvider initialFetch={knowledgeGraph}>
                                                                                            <BioactivityProvider initialFetch={knowledgeGraph}>
                                                                                              <TherapeuticEfficacyProvider initialFetch={knowledgeGraph}>
                                                                                                <DrugInteractionProvider initialFetch={drugInteraction}>
                                                                                                  <BiomarkerAssociationProvider initialFetch={knowledgeGraph}>
                                                                                                    <GenomicAssociationProvider initialFetch={genomicAssociation}>
                                                                                                      <VariantPhenotypeProvider initialFetch={knowledgeGraph}>
                                                                                                        <PatentClaimProvider initialFetch={commercial}>
                                                                                                          <PatentAssigneeProvider initialFetch={commercial}>
                                                                                                            <AssetOwnershipProvider initialFetch={commercial}>
                                                                                                              <TransactionProvider initialFetch={commercial}>
                                                                                                                <LicensingAgreementProvider initialFetch={commercial}>
                                                                                                                  <DevelopmentPipelineProvider initialFetch={commercial}>
                                                                                                                    <RegulatoryApprovalProvider initialFetch={commercial}>
                                                                                                                      <TechnologyPlatformProvider initialFetch={commercial}>
                                                                                                                        <AssetTechnologyPlatformProvider initialFetch={commercial}>
                                                                                                                          <OrganizationTechnologyPlatformProvider initialFetch={commercial}>
                                                                                                                            {children}
                                                                                                                          </OrganizationTechnologyPlatformProvider>
                                                                                                                        </AssetTechnologyPlatformProvider>
                                                                                                                      </TechnologyPlatformProvider>
                                                                                                                    </RegulatoryApprovalProvider>
                                                                                                                  </DevelopmentPipelineProvider>
                                                                                                                </LicensingAgreementProvider>
                                                                                                              </TransactionProvider>
                                                                                                            </AssetOwnershipProvider>
                                                                                                          </PatentAssigneeProvider>
                                                                                                        </PatentClaimProvider>
                                                                                                      </VariantPhenotypeProvider>
                                                                                                    </GenomicAssociationProvider>
                                                                                                  </BiomarkerAssociationProvider>
                                                                                                </DrugInteractionProvider>
                                                                                              </TherapeuticEfficacyProvider>
                                                                                            </BioactivityProvider>
                                                                                          </DrugTargetMechanismProvider>
                                                                                        </UnitOfMeasureProvider>
                                                                                      </ExternalReferenceProvider>
                                                                                    </ContextAttributeProvider>
                                                                                  </EvidenceAssertionProvider>
                                                                                </SourceProvider>
                                                                              </BiologicalRelationshipProvider>
                                                                            </PathwayMembershipProvider>
                                                                          </OntologyTermProvider>
                                                                        </RecommendationProvider>
                                                                      </PathwayScoreProvider>
                                                                    </UserTreatmentLogProvider>
                                                                  </UserBiomarkerReadingProvider>
                                                                </UserVariantProvider>
                                                              </GenomicFileProvider>
                                                            </DataSourceProvider>
                                                          </UserProfileProvider>
                                                        </AssayReadoutProvider>
                                                      </AssayRunProvider>
                                                    </AssayProtocolProvider>
                                                  </BiospecimenProvider>
                                                </SubjectProvider>
                                              </DesignMutationProvider>
                                            </ConstructProvider>
                                          </CandidateProvider>
                                        </OligonucleotideProvider>
                                      </TherapeuticPeptideProvider>
                                    </BiologicProvider>
                                  </SmallMoleculeProvider>
                                </PeptideFragmentProvider>
                              </VariantProvider>
                            </ProteinDomainProvider>
                          </ExonProvider>
                        </ProteinProvider>
                      </TranscriptProvider>
                    </GeneProvider>
                  </OrganismProvider>
                </BiomarkerProvider>
              </PhenotypeProvider>
            </PathwayProvider>
          </PatentProvider>
        </IndicationProvider>
      </TherapeuticAssetProvider>
    </MarketOrganizationProvider>
  );
}

/**
 * Complete nexotype providers component
 *
 * Provides all required providers for nexotype hooks to work properly.
 * PermissionsProvider wraps everything as the outermost provider —
 * it fetches the user's access map from the backend, then GatedProviders
 * conditionally initializes only the domains the user can access.
 *
 * Note: This should be nested inside AccountsProviders since nexotype
 * depends on organization context from accounts module.
 */
export function NexotypeProviders({ children }: NexotypeProvidersProps) {
  return (
    <PermissionsProvider>
      <GatedProviders>
        {children}
      </GatedProviders>
    </PermissionsProvider>
  );
}

/**
 * Default export
 */
export default NexotypeProviders;
