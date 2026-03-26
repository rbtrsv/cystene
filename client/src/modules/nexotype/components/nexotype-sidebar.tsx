"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  LogOut,
  Moon,
  Sun,
  User2,
  Building,
  Building2,
  FlaskConical,
  Heart,
  ScrollText,
  Route,
  Activity,
  Database,
  TestTubeDiagonal,
  Bug,
  Dna,
  FileText,
  Atom,
  Brackets,
  Puzzle,
  Scissors,
  GitBranch,
  Pill,
  BookOpen,
  Network,
  Link2,
  FileSearch,
  ShieldCheck,
  Tag,
  ExternalLink,
  Ruler,
  Lightbulb,
  Crosshair,
  Zap,
  TrendingUp,
  Repeat,
  FileCheck,
  UserCheck,
  KeyRound,
  ArrowLeftRight,
  Handshake,
  Layers,
  Cpu,
  Combine,
  Lock,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/modules/accounts/store/auth.server.store"
import { usePermissions } from "@/modules/nexotype/hooks/shared/use-permissions"

import { Avatar, AvatarFallback } from "@/modules/shadcnui/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/modules/shadcnui/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/modules/shadcnui/components/ui/sidebar"

import Image from "next/image"
import logoNexotypeDark from '@/modules/main/logos/nexotype-black-text-with-logo.svg';
import logoNexotypeLight from '@/modules/main/logos/nextotype-white-text-with-logo.svg';

// After `npx shadcn@latest add sidebar` re-apply these fixes in sidebar.tsx:
// 1. CSS vars: w-[--sidebar-width] → w-(--sidebar-width), same for w-icon and max-w-skeleton
// 2. Scrollbar: add `no-scrollbar` class to SidebarContent (requires @utility in globals.css)
// 3. Do NOT add className="overflow-x-hidden" to <SidebarContent> — it conflicts with no-scrollbar

export function NexotypeSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isMobile } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuthStore()
  const { permissions } = usePermissions()

  // Why: determines if ALL items in a sidebar group are locked (no entity overrides accessible)
  // Uses permissions.routes from backend — no authorization logic on frontend
  const isGroupLocked = (routes: string[]) => {
    if (!permissions?.routes) return false;
    return routes.every(r => permissions.routes?.[r] && !permissions.routes[r].can_read);
  };

  // Route lists per sidebar group (presentation metadata — which items are in which sidebar group)
  const OMICS_ROUTES = ['organisms', 'genes', 'transcripts', 'exons', 'proteins', 'protein-domains', 'peptide-fragments', 'variants'];
  const CLINICAL_ROUTES = ['indications', 'phenotypes', 'biomarkers', 'pathways'];
  const ASSET_ROUTES = ['therapeutic-assets', 'small-molecules', 'biologics', 'therapeutic-peptides', 'oligonucleotides'];
  const ENGINEERING_ROUTES = ['candidates', 'constructs', 'design-mutations'];
  const LIMS_ROUTES = ['subjects', 'biospecimens', 'assay-protocols', 'assay-runs', 'assay-readouts'];
  const USER_ROUTES = ['user-profiles', 'data-sources', 'genomic-files', 'user-variants', 'user-biomarker-readings', 'user-treatment-logs', 'pathway-scores', 'recommendations'];
  const KG_ROUTES = ['pathway-memberships', 'biological-relationships', 'sources', 'evidence-assertions', 'context-attributes', 'drug-target-mechanisms', 'bioactivities', 'therapeutic-efficacies', 'drug-interactions', 'biomarker-associations', 'genomic-associations', 'variant-phenotypes'];
  const COMMERCIAL_ROUTES = ['market-organizations', 'patents', 'patent-claims', 'patent-assignees', 'asset-ownerships', 'transactions', 'licensing-agreements', 'development-pipelines', 'regulatory-approvals', 'technology-platforms', 'asset-technology-platforms', 'organization-technology-platforms'];
  const STANDARDIZATION_ROUTES = ['ontology-terms', 'external-references', 'units-of-measure'];

  // Hydration state - prevents radix-ui ID mismatch between server/client
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Theme switching functionality
  const [theme, setTheme] = useState("light")

  // Initialize theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")

    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    } else {
      setTheme("light")
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const handleThemeSwitch = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  // Function to check if a path is active
  const isActive = (path: string) => {
    // Exact match for home
    if (path === "/" && pathname === "/") {
      return true
    }

    // For other routes, check if the pathname starts with the path
    return pathname === path || (pathname.startsWith(path) && path !== "/")
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      // Navigate to logout page which handles the actual logout flow
      router.push('/logout');
    } catch (err) {
      console.error('Error during sign out:', err);
    }
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Updated Header with Logo */}
      <SidebarHeader className="p-4">
        <div className="flex items-center">
          <Image
            src={logoNexotypeLight}
            alt="Logo"
            width={180}
            height={42}
            className="dark:block hidden"
          />
          <Image
            src={logoNexotypeDark}
            alt="Logo"
            width={180}
            height={42}
            className="dark:hidden block"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Organizations */}
        <SidebarGroup>
          <SidebarGroupLabel>Organizations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/organizations")} tooltip="Organizations">
                  <Link href="/organizations">
                    <Building className="h-4 w-4" />
                    <span>Organizations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Omics Registry — Domain 2 */}
        <SidebarGroup>
          <SidebarGroupLabel>
            Omics Registry
            {isGroupLocked(OMICS_ROUTES) && (
              <Lock className="ml-2 h-2.5 w-2.5 text-muted-foreground" />
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/organisms")} tooltip="Organisms">
                  <Link href="/organisms">
                    <Bug className="h-4 w-4" />
                    <span>Organisms</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/genes")} tooltip="Genes">
                  <Link href="/genes">
                    <Dna className="h-4 w-4" />
                    <span>Genes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/transcripts")} tooltip="Transcripts">
                  <Link href="/transcripts">
                    <FileText className="h-4 w-4" />
                    <span>Transcripts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/exons")} tooltip="Exons">
                  <Link href="/exons">
                    <Brackets className="h-4 w-4" />
                    <span>Exons</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/proteins")} tooltip="Proteins">
                  <Link href="/proteins">
                    <Atom className="h-4 w-4" />
                    <span>Proteins</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/protein-domains")} tooltip="Protein Domains">
                  <Link href="/protein-domains">
                    <Puzzle className="h-4 w-4" />
                    <span>Protein Domains</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/peptide-fragments")} tooltip="Peptide Fragments">
                  <Link href="/peptide-fragments">
                    <Scissors className="h-4 w-4" />
                    <span>Peptide Fragments</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/variants")} tooltip="Variants">
                  <Link href="/variants">
                    <GitBranch className="h-4 w-4" />
                    <span>Variants</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Clinical & Phenotypic — Domain 3 */}
        <SidebarGroup>
          <SidebarGroupLabel>
            Clinical & Phenotypic
            {isGroupLocked(CLINICAL_ROUTES) && (
              <Lock className="ml-2 h-2.5 w-2.5 text-muted-foreground" />
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/indications")} tooltip="Indications">
                  <Link href="/indications">
                    <Heart className="h-4 w-4" />
                    <span>Indications</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/phenotypes")} tooltip="Phenotypes">
                  <Link href="/phenotypes">
                    <Activity className="h-4 w-4" />
                    <span>Phenotypes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/biomarkers")} tooltip="Biomarkers">
                  <Link href="/biomarkers">
                    <TestTubeDiagonal className="h-4 w-4" />
                    <span>Biomarkers</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/pathways")} tooltip="Pathways">
                  <Link href="/pathways">
                    <Route className="h-4 w-4" />
                    <span>Pathways</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Asset Management — Domain 4 */}
        <SidebarGroup>
          <SidebarGroupLabel>
            Asset Management
            {isGroupLocked(ASSET_ROUTES) && (
              <Lock className="ml-2 h-2.5 w-2.5 text-muted-foreground" />
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/therapeutic-assets")} tooltip="Therapeutic Assets">
                  <Link href="/therapeutic-assets">
                    <FlaskConical className="h-4 w-4" />
                    <span>Therapeutic Assets</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/small-molecules")} tooltip="Small Molecules">
                  <Link href="/small-molecules">
                    <Pill className="h-4 w-4" />
                    <span>Small Molecules</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/biologics")} tooltip="Biologics">
                  <Link href="/biologics">
                    <FlaskConical className="h-4 w-4" />
                    <span>Biologics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/therapeutic-peptides")} tooltip="Therapeutic Peptides">
                  <Link href="/therapeutic-peptides">
                    <Scissors className="h-4 w-4" />
                    <span>Therapeutic Peptides</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/oligonucleotides")} tooltip="Oligonucleotides">
                  <Link href="/oligonucleotides">
                    <Brackets className="h-4 w-4" />
                    <span>Oligonucleotides</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* R&D Engineering — Domain 5 */}
        <SidebarGroup>
          <SidebarGroupLabel>
            R&D Engineering
            {isGroupLocked(ENGINEERING_ROUTES) && (
              <Lock className="ml-2 h-2.5 w-2.5 text-muted-foreground" />
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/candidates")} tooltip="Candidates">
                  <Link href="/candidates">
                    <GitBranch className="h-4 w-4" />
                    <span>Candidates</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/constructs")} tooltip="Constructs">
                  <Link href="/constructs">
                    <Puzzle className="h-4 w-4" />
                    <span>Constructs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/design-mutations")} tooltip="Design Mutations">
                  <Link href="/design-mutations">
                    <Scissors className="h-4 w-4" />
                    <span>Design Mutations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* LIMS & Empirical Data — Domain 6 */}
        <SidebarGroup>
          <SidebarGroupLabel>
            LIMS & Empirical Data
            {isGroupLocked(LIMS_ROUTES) && (
              <Lock className="ml-2 h-2.5 w-2.5 text-muted-foreground" />
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/subjects")} tooltip="Subjects">
                  <Link href="/subjects">
                    <User2 className="h-4 w-4" />
                    <span>Subjects</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/biospecimens")} tooltip="Biospecimens">
                  <Link href="/biospecimens">
                    <TestTubeDiagonal className="h-4 w-4" />
                    <span>Biospecimens</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/assay-protocols")} tooltip="Assay Protocols">
                  <Link href="/assay-protocols">
                    <FlaskConical className="h-4 w-4" />
                    <span>Assay Protocols</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/assay-runs")} tooltip="Assay Runs">
                  <Link href="/assay-runs">
                    <Activity className="h-4 w-4" />
                    <span>Assay Runs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/assay-readouts")} tooltip="Assay Readouts">
                  <Link href="/assay-readouts">
                    <FileSearch className="h-4 w-4" />
                    <span>Assay Readouts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* User & Personalization — Domain 8 */}
        <SidebarGroup>
          <SidebarGroupLabel>
            User & Personalization
            {isGroupLocked(USER_ROUTES) && (
              <Lock className="ml-2 h-2.5 w-2.5 text-muted-foreground" />
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/user-profiles")} tooltip="User Profiles">
                  <Link href="/user-profiles">
                    <User2 className="h-4 w-4" />
                    <span>User Profiles</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/data-sources")} tooltip="Data Sources">
                  <Link href="/data-sources">
                    <Database className="h-4 w-4" />
                    <span>Data Sources</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/genomic-files")} tooltip="Genomic Files">
                  <Link href="/genomic-files">
                    <FileText className="h-4 w-4" />
                    <span>Genomic Files</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/user-variants")} tooltip="User Variants">
                  <Link href="/user-variants">
                    <GitBranch className="h-4 w-4" />
                    <span>User Variants</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/user-biomarker-readings")} tooltip="User Biomarker Readings">
                  <Link href="/user-biomarker-readings">
                    <Activity className="h-4 w-4" />
                    <span>User Biomarker Readings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/user-treatment-logs")} tooltip="User Treatment Logs">
                  <Link href="/user-treatment-logs">
                    <Pill className="h-4 w-4" />
                    <span>User Treatment Logs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/pathway-scores")} tooltip="Pathway Scores">
                  <Link href="/pathway-scores">
                    <Route className="h-4 w-4" />
                    <span>Pathway Scores</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/recommendations")} tooltip="Recommendations">
                  <Link href="/recommendations">
                    <Lightbulb className="h-4 w-4" />
                    <span>Recommendations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Knowledge Graph — Domain 7 */}
        <SidebarGroup>
          <SidebarGroupLabel>
            Knowledge Graph
            {isGroupLocked(KG_ROUTES) && (
              <Lock className="ml-2 h-2.5 w-2.5 text-muted-foreground" />
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/pathway-memberships")} tooltip="Pathway Memberships">
                  <Link href="/pathway-memberships">
                    <Network className="h-4 w-4" />
                    <span>Pathway Memberships</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/biological-relationships")} tooltip="Biological Relationships">
                  <Link href="/biological-relationships">
                    <Link2 className="h-4 w-4" />
                    <span>Biological Relationships</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/sources")} tooltip="Sources">
                  <Link href="/sources">
                    <FileSearch className="h-4 w-4" />
                    <span>Sources</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/evidence-assertions")} tooltip="Evidence Assertions">
                  <Link href="/evidence-assertions">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Evidence Assertions</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/context-attributes")} tooltip="Context Attributes">
                  <Link href="/context-attributes">
                    <Tag className="h-4 w-4" />
                    <span>Context Attributes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/drug-target-mechanisms")} tooltip="Drug Target Mechanisms">
                  <Link href="/drug-target-mechanisms">
                    <Crosshair className="h-4 w-4" />
                    <span>Drug Target Mechanisms</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/bioactivities")} tooltip="Bioactivities">
                  <Link href="/bioactivities">
                    <Zap className="h-4 w-4" />
                    <span>Bioactivities</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/therapeutic-efficacies")} tooltip="Therapeutic Efficacies">
                  <Link href="/therapeutic-efficacies">
                    <TrendingUp className="h-4 w-4" />
                    <span>Therapeutic Efficacies</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/drug-interactions")} tooltip="Drug Interactions">
                  <Link href="/drug-interactions">
                    <Repeat className="h-4 w-4" />
                    <span>Drug Interactions</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/biomarker-associations")} tooltip="Biomarker Associations">
                  <Link href="/biomarker-associations">
                    <Link2 className="h-4 w-4" />
                    <span>Biomarker Associations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/genomic-associations")} tooltip="Genomic Associations">
                  <Link href="/genomic-associations">
                    <Dna className="h-4 w-4" />
                    <span>Genomic Associations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/variant-phenotypes")} tooltip="Variant Phenotypes">
                  <Link href="/variant-phenotypes">
                    <GitBranch className="h-4 w-4" />
                    <span>Variant Phenotypes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Commercial Intelligence — Domain 10 */}
        <SidebarGroup>
          <SidebarGroupLabel>
            Commercial Intelligence
            {isGroupLocked(COMMERCIAL_ROUTES) && (
              <Lock className="ml-2 h-2.5 w-2.5 text-muted-foreground" />
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/market-organizations")} tooltip="Market Organizations">
                  <Link href="/market-organizations">
                    <Building2 className="h-4 w-4" />
                    <span>Market Organizations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/patents")} tooltip="Patents">
                  <Link href="/patents">
                    <ScrollText className="h-4 w-4" />
                    <span>Patents</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/patent-claims")} tooltip="Patent Claims">
                  <Link href="/patent-claims">
                    <FileCheck className="h-4 w-4" />
                    <span>Patent Claims</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/patent-assignees")} tooltip="Patent Assignees">
                  <Link href="/patent-assignees">
                    <UserCheck className="h-4 w-4" />
                    <span>Patent Assignees</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/asset-ownerships")} tooltip="Asset Ownerships">
                  <Link href="/asset-ownerships">
                    <KeyRound className="h-4 w-4" />
                    <span>Asset Ownerships</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/transactions")} tooltip="Transactions">
                  <Link href="/transactions">
                    <ArrowLeftRight className="h-4 w-4" />
                    <span>Transactions</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/licensing-agreements")} tooltip="Licensing Agreements">
                  <Link href="/licensing-agreements">
                    <Handshake className="h-4 w-4" />
                    <span>Licensing Agreements</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/development-pipelines")} tooltip="Development Pipelines">
                  <Link href="/development-pipelines">
                    <Layers className="h-4 w-4" />
                    <span>Development Pipelines</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/regulatory-approvals")} tooltip="Regulatory Approvals">
                  <Link href="/regulatory-approvals">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Regulatory Approvals</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/technology-platforms")} tooltip="Technology Platforms">
                  <Link href="/technology-platforms">
                    <Cpu className="h-4 w-4" />
                    <span>Technology Platforms</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/asset-technology-platforms")} tooltip="Asset Tech Platforms">
                  <Link href="/asset-technology-platforms">
                    <Combine className="h-4 w-4" />
                    <span>Asset Tech Platforms</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/organization-technology-platforms")} tooltip="Org Tech Platforms">
                  <Link href="/organization-technology-platforms">
                    <Building2 className="h-4 w-4" />
                    <span>Org Tech Platforms</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Standardization — Domain 1 */}
        <SidebarGroup>
          <SidebarGroupLabel>
            Standardization
            {isGroupLocked(STANDARDIZATION_ROUTES) && (
              <Lock className="ml-2 h-2.5 w-2.5 text-muted-foreground" />
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/ontology-terms")} tooltip="Ontology Terms">
                  <Link href="/ontology-terms">
                    <BookOpen className="h-4 w-4" />
                    <span>Ontology Terms</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/external-references")} tooltip="External References">
                  <Link href="/external-references">
                    <ExternalLink className="h-4 w-4" />
                    <span>External References</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/units-of-measure")} tooltip="Units of Measure">
                  <Link href="/units-of-measure">
                    <Ruler className="h-4 w-4" />
                    <span>Units of Measure</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile in Footer with Theme Toggle */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {hasMounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    tooltip="User Profile"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg">
                        {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.name || (user?.email ?
                          user.email.split('@')[0] :
                          'User')}
                      </span>
                      <span className="truncate text-xs">
                        {user?.email || ''}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel>User Settings</DropdownMenuLabel>

                  <DropdownMenuItem asChild>
                    <Link href="/settings/profile">
                      <User2 className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>

                  {/* Theme Toggle */}
                  <DropdownMenuItem onClick={handleThemeSwitch}>
                    {theme === "dark" ? (
                      <>
                        <Sun className="mr-2 h-4 w-4" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="mr-2 h-4 w-4" />
                        Dark Mode
                      </>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton size="lg" className="cursor-default">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">U</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">User</span>
                  <span className="truncate text-xs">&nbsp;</span>
                </div>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Rail for collapsing the sidebar */}
      <SidebarRail />
    </Sidebar>
  )
}

export default NexotypeSidebar
