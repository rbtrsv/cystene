# Entity Management UX Proposal

**Date**: 2025-10-13
**Context**: Designing UX for entity management alongside organization management

---

## Current State Analysis

### ✅ Backend Structure (Complete)
- **Entity models**: Entity, EntityOrganizationMember, EntityOrganizationInvitation, Stakeholder, Syndicate
- **Entity subrouters**:
  - `entity_subrouter.py` ✅
  - `entity_organization_member_subrouter.py` ✅
  - `entity_organization_invitation_subrouter.py` ✅
  - `stakeholder_subrouter.py` ✅
  - `syndicate_subrouter.py` ✅
  - `syndicate_member_subrouter.py` ✅

### ❌ Frontend Structure (Missing)
- No entity management pages
- No entity switcher/selector
- No entity creation flow
- No entity-organization member management UI

---

## Conceptual Model Clarification

### Two-Tier Access Control

```
User → Organization → Entity
  ↓         ↓            ↓
Role    Role (Org)   Access
```

**Example Flow**:
1. User "Alice" belongs to "ABC Capital" organization with role "ADMIN"
2. Organization "ABC Capital" has access to Entity "Startup X" with role "EDITOR"
3. Alice's effective permissions on "Startup X" depend on BOTH roles

### Entity vs Organization

**Organization** (Accounts layer):
- Controls who can access the platform
- Pays subscription
- Has members (users)
- Think: Your company/team

**Entity** (AssetManager layer):
- Represents financial entities (funds, companies, portfolio companies)
- Can be funds that invest OR companies that raise funding
- Has organization members (organizations have access)
- Think: Your portfolio companies, your fund itself, companies you track

---

## UX Structure Proposal

### Sidebar Navigation (Updated)

```
┌─────────────────────────────────┐
│ [Finpy Logo]                    │
├─────────────────────────────────┤
│ 📊 Overview                     │
│   • Dashboard                   │
│   • Analytics                   │
├─────────────────────────────────┤
│ 🏢 Entities (NEW)               │ ← Primary navigation
│   • All Entities                │
│   • My Entities                 │
│   • Create Entity               │
├─────────────────────────────────┤
│ 💼 Cap Table                    │
│ 📈 Portfolio                    │
│ 📁 Dealflow                     │
│ 💰 Fund Admin                   │
│ 📊 Investor Reporting           │
│ 🏢 Companies                    │
├─────────────────────────────────┤
│ ⚙️  Settings                    │
│   • Organizations               │ ← Organization-level
│   • Billing                     │
│   • Team Members                │
│   • User Profile                │
├─────────────────────────────────┤
│ [User Avatar]                   │
│  John Doe                       │
│  ABC Capital (Owner)            │ ← Current organization
│  • Switch Organization          │
│  • Theme Toggle                 │
│  • Logout                       │
└─────────────────────────────────┘
```

### Top Bar (Entity Context)

```
┌──────────────────────────────────────────────────────────────────┐
│ [☰] / Entities / Startup X      [ABC Capital ▼]  [Startup X ▼]  │
│                                  └── Organization └── Entity      │
└──────────────────────────────────────────────────────────────────┘
```

**Two Dropdowns**:
1. **Organization Dropdown**: Switch which organization you're acting as
2. **Entity Dropdown**: Switch which entity you're viewing (filtered by org access)

---

## Page Structure

### `/dashboard` (Home/Overview)
- **Current Implementation**: Shows user profile, organization, subscription
- **New Addition**: Add "Entities" card showing entity count
- **Action**: "View All Entities" button → routes to `/dashboard/entities`

### `/dashboard/entities` (NEW - Entity List)

**Purpose**: Central hub for all entities the current organization has access to

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Entities                                    [+ Create Entity]   │
├─────────────────────────────────────────────────────────────────┤
│ Filters:                                                        │
│ [All Entities ▼] [Entity Type: All ▼] [Role: All ▼]           │
├─────────────────────────────────────────────────────────────────┤
│ 🏢 Tech Startup Inc.                              [OWNER]       │
│    Type: Company • Valuation: $5M • Created: 2024-01-15        │
│    [View Details] [Manage Access] [Settings]                   │
├─────────────────────────────────────────────────────────────────┤
│ 💼 ABC Venture Fund I                            [ADMIN]        │
│    Type: Fund • AUM: $50M • Created: 2023-06-20                │
│    [View Details] [Manage Access] [Settings]                   │
├─────────────────────────────────────────────────────────────────┤
│ 🏢 HealthTech Co.                                [VIEWER]       │
│    Type: Company • Valuation: $12M • Created: 2024-03-10       │
│    [View Details]                                               │
└─────────────────────────────────────────────────────────────────┘
```

**Features**:
- List all entities accessible by current organization
- Show entity type (fund, company, individual)
- Display organization's role in each entity (OWNER, ADMIN, EDITOR, VIEWER)
- Filter by: Entity type, Role, Creation date
- Search by name
- Sort by: Name, Created date, Valuation

**API**:
```
GET /assetmanager/entities/?organization_id={active_org_id}
```

### `/dashboard/entities/create` (NEW - Create Entity)

**Purpose**: Create new entity and set initial access

**Form Fields**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Create New Entity                                               │
├─────────────────────────────────────────────────────────────────┤
│ Basic Information                                               │
│ ─────────────────                                               │
│ Entity Name *                                                   │
│ [_____________________________]                                 │
│                                                                 │
│ Entity Type *                                                   │
│ ○ Fund      ○ Company      ○ Individual                        │
│                                                                 │
│ Initial Valuation (optional)                                    │
│ [$_____________________________]                                │
│                                                                 │
│ Cash Balance                                                    │
│ [$_____________________________]                                │
│                                                                 │
│ Parent Entity (optional)                                        │
│ [Select parent entity... ▼]                                     │
│                                                                 │
│ ─────────────────                                               │
│ Organization Access                                             │
│ ─────────────────                                               │
│ • ABC Capital will be set as OWNER automatically                │
│                                                                 │
│ [Cancel]                               [Create Entity]          │
└─────────────────────────────────────────────────────────────────┘
```

**Flow**:
1. User fills form
2. POST to `/assetmanager/entities/`
3. Automatically creates `EntityOrganizationMember` with role=OWNER for current organization
4. Redirects to `/dashboard/entities/{entity_id}`

**API**:
```
POST /assetmanager/entities/
{
  "name": "Tech Startup Inc.",
  "entity_type": "company",
  "current_valuation": 5000000.00,
  "cash_balance": 100000.00,
  "organization_id": 1,
  "parent_id": null
}

Response creates:
- Entity record
- EntityOrganizationMember (organization_id=1, entity_id=X, role=OWNER)
```

### `/dashboard/entities/{entity_id}` (NEW - Entity Details)

**Purpose**: Dashboard for a specific entity

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Tech Startup Inc.                   [Edit] [Manage Access] [⚙️]  │
│ Company • Created Jan 15, 2024                                  │
├─────────────────────────────────────────────────────────────────┤
│ Overview                                                        │
│ ─────────────────────────────────────────────────────────────── │
│ Valuation: $5,000,000       Cash Balance: $100,000            │
│ Parent Entity: ABC Venture Fund I                              │
│ Your Organization Role: OWNER                                   │
├─────────────────────────────────────────────────────────────────┤
│ Tabs:                                                           │
│ [Overview] [Stakeholders] [Deals] [Cap Table] [Portfolio]      │
│                                                                 │
│ (Tab content based on entity type and role)                     │
└─────────────────────────────────────────────────────────────────┘
```

**Tabs by Entity Type**:

**For Funds**:
- Overview: Fund size, vintage year, strategy
- Portfolio: Investments made by this fund
- Stakeholders: LPs, GPs
- Performance: IRR, TVPI, DPI
- Cap Table: Fund's own cap table (if fund raised capital)

**For Companies**:
- Overview: Valuation, stage, industry
- Cap Table: Securities, shareholders
- Deals: Active fundraising rounds
- Stakeholders: Investors, employees with equity
- Financials: P&L, Balance Sheet

**For Individuals**:
- Overview: Professional background
- Investments: What they've invested in
- Stakeholder Roles: Where they're a stakeholder

### `/dashboard/entities/{entity_id}/access` (NEW - Entity Access Management)

**Purpose**: Manage which organizations can access this entity

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Tech Startup Inc. - Organization Access                        │
├─────────────────────────────────────────────────────────────────┤
│ Current Access                                                  │
│ ─────────────────────────────────────────────────────────────── │
│ 🏢 ABC Capital                                        [OWNER]   │
│    2 members • Access since Jan 15, 2024                       │
│    [Change Role ▼] [Remove Access]                             │
│ ─────────────────────────────────────────────────────────────── │
│ 🏢 XYZ Ventures                                       [VIEWER]  │
│    5 members • Access since Mar 20, 2024                       │
│    [Change Role ▼] [Remove Access]                             │
├─────────────────────────────────────────────────────────────────┤
│ Pending Invitations                                             │
│ ─────────────────────────────────────────────────────────────── │
│ 🏢 DEF Partners (Invited as EDITOR)                            │
│    Invited by: John Doe • Feb 10, 2024                         │
│    [Resend] [Cancel Invitation]                                │
├─────────────────────────────────────────────────────────────────┤
│ Invite Organization                                             │
│ ─────────────────────────────────────────────────────────────── │
│ Organization Email/Name                                         │
│ [___________________________]                                   │
│ Role                                                            │
│ [VIEWER ▼]                                                      │
│ [Send Invitation]                                               │
└─────────────────────────────────────────────────────────────────┘
```

**Permissions**:
- OWNER: Can manage all access
- ADMIN: Can invite/remove VIEWER and EDITOR
- EDITOR: Can view access list only
- VIEWER: Cannot access this page

**API**:
```
GET /assetmanager/entities/{entity_id}/organization-members
POST /assetmanager/entities/{entity_id}/organization-members
PUT /assetmanager/entities/{entity_id}/organization-members/{member_id}
DELETE /assetmanager/entities/{entity_id}/organization-members/{member_id}

GET /assetmanager/entities/{entity_id}/organization-invitations
POST /assetmanager/entities/{entity_id}/organization-invitations
```

### `/dashboard/settings/organizations` (Existing concept, needs implementation)

**Purpose**: Manage organizations the user belongs to (not entity-related)

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Organizations                           [+ Create Organization] │
├─────────────────────────────────────────────────────────────────┤
│ 🏢 ABC Capital                                        [OWNER]   │
│    3 members • Created Jan 10, 2024                            │
│    Has access to 12 entities                                   │
│    [Switch To] [Settings] [Leave]                              │
│ ─────────────────────────────────────────────────────────────── │
│ 🏢 XYZ Ventures                                       [VIEWER]  │
│    8 members • Joined Mar 15, 2024                             │
│    Has access to 5 entities                                    │
│    [Switch To] [Leave]                                         │
└─────────────────────────────────────────────────────────────────┘
```

**Key Distinction**:
- This page shows **organizations you're a member of** (user → organization)
- Entity access page shows **organizations that can access an entity** (organization → entity)

---

## Context Management (State)

### Organization Context
```typescript
// stores/organization.store.ts
interface OrganizationStore {
  activeOrganizationId: number | null
  organizations: Organization[]
  activeOrganization: Organization | null
  setActiveOrganization: (id: number) => void
  fetchOrganizations: () => Promise<void>
}
```

**Storage**: `localStorage.activeOrganizationId`
**Persistence**: Across sessions
**Used by**: All entity queries, entity creation

### Entity Context
```typescript
// stores/entity.store.ts
interface EntityStore {
  activeEntityId: number | null
  entities: Entity[]
  activeEntity: Entity | null
  setActiveEntity: (id: number) => void
  fetchEntities: (organizationId: number) => Promise<void>
}
```

**Storage**: `localStorage.activeEntityId`
**Persistence**: Within session only (cleared on org switch)
**Used by**: Cap table, portfolio, dealflow pages

### Context Flow
```
1. User logs in
   → Load organizations
   → Set activeOrganizationId (from localStorage or first org)

2. User navigates to /dashboard/entities
   → Fetch entities filtered by activeOrganizationId
   → Display entity list

3. User clicks entity
   → Set activeEntityId
   → Navigate to /dashboard/entities/{entity_id}

4. User switches organization (in dropdown)
   → Set new activeOrganizationId
   → Clear activeEntityId (different org = different entities)
   → Refetch entities for new organization
   → Redirect to /dashboard/entities

5. All entity-scoped pages (cap table, portfolio, etc.)
   → Use activeEntityId to filter data
   → If no activeEntityId, prompt to select entity
```

---

## Navigation Patterns

### Pattern 1: Global Entity Selector (Recommended ⭐)

**Top Bar**:
```
┌──────────────────────────────────────────────────────────┐
│ [☰] Cap Table              [ABC Capital ▼] [Startup X ▼] │
│                                      ↑              ↑     │
│                               Organization    Entity     │
└──────────────────────────────────────────────────────────┘
```

**Behavior**:
- Entity dropdown shows entities accessible by current organization
- Selecting entity updates `activeEntityId`
- Cap table, portfolio, dealflow pages filter by `activeEntityId`
- If no entity selected, show prompt: "Select an entity to view data"

**Pros**:
- Always visible
- Clear context
- Easy switching

**Cons**:
- Takes top bar space
- May confuse single-entity users

### Pattern 2: Entity Required on Page Entry

**Behavior**:
- No global entity selector
- When user navigates to `/dashboard/cap-table`, check if `activeEntityId` exists
- If not, show modal: "Select entity to view cap table"
- User selects from list → set `activeEntityId` → show data

**Pros**:
- Cleaner UI (no dropdown)
- Explicit entity selection

**Cons**:
- Extra step for users
- Less discoverable

### Pattern 3: Entity Tabs in Sidebar (Alternative)

**Sidebar**:
```
┌─────────────────────────────┐
│ Entities                    │
│ ├─ Tech Startup Inc.        │ ← Click to expand
│ │   ├─ Cap Table            │
│ │   ├─ Portfolio            │
│ │   └─ Deals                │
│ ├─ ABC Venture Fund I       │
│ │   ├─ Cap Table            │
│ │   ├─ Portfolio            │
│ │   └─ Deals                │
│ └─ Create Entity            │
└─────────────────────────────┘
```

**Pros**:
- All entities visible at once
- Direct navigation to entity pages

**Cons**:
- Sidebar gets very long with many entities
- Doesn't scale past ~5 entities

---

## Recommended Approach: **Pattern 1 (Global Entity Selector)**

### Why?
1. **Scalability**: Works with 1 or 100 entities
2. **Industry Standard**: Used by Vercel (projects), Stripe (accounts), Linear (teams)
3. **Context Clarity**: Always know which org + entity you're working with
4. **Performance**: No extra modals/prompts

### Implementation

**Top Bar Component**:
```tsx
// components/entity-selector.tsx
export function EntitySelector() {
  const { activeEntityId, entities, setActiveEntity } = useEntityStore()
  const { activeOrganizationId } = useOrganizationStore()

  useEffect(() => {
    if (activeOrganizationId) {
      fetchEntities(activeOrganizationId)
    }
  }, [activeOrganizationId])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        {activeEntity?.name || "Select Entity"}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {entities.map(entity => (
          <DropdownMenuItem
            key={entity.id}
            onClick={() => setActiveEntity(entity.id)}
          >
            {entity.name} ({entity.entity_type})
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/entities">View All Entities</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/entities/create">Create Entity</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## API Routes Summary

### Entities
```
GET    /assetmanager/entities/                              ✅ Exists
POST   /assetmanager/entities/                              ✅ Exists
GET    /assetmanager/entities/{entity_id}                   ✅ Exists
PUT    /assetmanager/entities/{entity_id}                   ✅ Exists
DELETE /assetmanager/entities/{entity_id}                   ✅ Exists
```

### Entity Organization Members
```
GET    /assetmanager/entities/{entity_id}/organization-members        ✅ Exists
POST   /assetmanager/entities/{entity_id}/organization-members        ✅ Exists
GET    /assetmanager/entities/{entity_id}/organization-members/{id}   ✅ Exists
PUT    /assetmanager/entities/{entity_id}/organization-members/{id}   ✅ Exists
DELETE /assetmanager/entities/{entity_id}/organization-members/{id}   ✅ Exists
```

### Entity Organization Invitations
```
GET    /assetmanager/entities/{entity_id}/organization-invitations        ✅ Exists
POST   /assetmanager/entities/{entity_id}/organization-invitations        ✅ Exists
GET    /assetmanager/entities/{entity_id}/organization-invitations/{id}   ✅ Exists
PUT    /assetmanager/entities/{entity_id}/organization-invitations/{id}   ✅ Exists
DELETE /assetmanager/entities/{entity_id}/organization-invitations/{id}   ✅ Exists
```

**All backend APIs already exist! ✅**

---

## Implementation Phases

### Phase 1: Entity List Page
**Files to create**:
- `/client/src/app/dashboard/entities/page.tsx`
- `/client/src/modules/assetmanager/hooks/use-entities.ts`
- `/client/src/modules/assetmanager/components/entity-list.tsx`
- `/client/src/modules/assetmanager/components/entity-card.tsx`

**Tasks**:
1. Create entity store (Zustand)
2. Fetch entities by organization
3. Display entity list with filters
4. Add "Create Entity" button

### Phase 2: Create Entity Flow
**Files to create**:
- `/client/src/app/dashboard/entities/create/page.tsx`
- `/client/src/modules/assetmanager/components/entity-form.tsx`

**Tasks**:
1. Build entity creation form
2. POST to `/assetmanager/entities/`
3. Handle success/error states
4. Redirect to entity detail page

### Phase 3: Entity Detail Page
**Files to create**:
- `/client/src/app/dashboard/entities/[entity_id]/page.tsx`
- `/client/src/modules/assetmanager/components/entity-overview.tsx`
- `/client/src/modules/assetmanager/components/entity-tabs.tsx`

**Tasks**:
1. Fetch entity by ID
2. Display entity overview
3. Add tabs (overview, stakeholders, deals, cap table)
4. Tab content varies by entity type

### Phase 4: Entity Access Management
**Files to create**:
- `/client/src/app/dashboard/entities/[entity_id]/access/page.tsx`
- `/client/src/modules/assetmanager/components/entity-access-list.tsx`
- `/client/src/modules/assetmanager/components/entity-invitation-form.tsx`

**Tasks**:
1. List organization members for entity
2. Invite new organizations
3. Change roles
4. Remove access

### Phase 5: Global Entity Selector
**Files to create**:
- `/client/src/modules/assetmanager/components/entity-selector.tsx`
- Update `/client/src/app/dashboard/layout.tsx` to include selector

**Tasks**:
1. Add entity dropdown to top bar
2. Implement entity switching
3. Update entity context on switch
4. Filter all entity-scoped pages by activeEntityId

### Phase 6: Update Existing Pages
**Files to update**:
- `/client/src/app/dashboard/page.tsx` (add entities card)
- Sidebar (add Entities section)
- Cap table pages (filter by activeEntityId)
- Portfolio pages (filter by activeEntityId)
- Dealflow pages (filter by activeEntityId)

---

## User Flows

### Flow 1: New User Creates First Entity
```
1. User registers → creates organization (auto-OWNER)
2. User logs in → dashboard shows "No entities yet"
3. User clicks "Create Entity"
4. Fills form (name, type, valuation)
5. Submits → Entity created with org as OWNER
6. Redirected to entity detail page
7. Can now use cap table, portfolio, etc. for this entity
```

### Flow 2: Multi-Entity User Switches Context
```
1. User viewing "Startup X" cap table
2. Wants to switch to "Startup Y"
3. Clicks entity dropdown in top bar
4. Selects "Startup Y"
5. activeEntityId updated
6. Cap table page refetches data for Startup Y
7. Context persists across navigation
```

### Flow 3: Fund Manager Grants Investor Access
```
1. Fund manager (ABC Capital) owns entity "Startup X"
2. Goes to "Startup X" → Access Management
3. Invites "XYZ Ventures" organization with VIEWER role
4. XYZ Ventures receives invitation
5. XYZ Ventures accepts → EntityOrganizationMember created
6. XYZ Ventures can now see "Startup X" in their entity list (read-only)
7. XYZ Ventures can view Startup X's cap table, deals, etc.
```

### Flow 4: Multi-Org User Switches Organization
```
1. User is member of "ABC Capital" (OWNER) and "XYZ Ventures" (VIEWER)
2. Currently viewing entities from ABC Capital
3. Clicks organization dropdown → selects XYZ Ventures
4. activeOrganizationId updated
5. activeEntityId cleared (entities different per org)
6. Entity list refetches → shows entities XYZ Ventures has access to
7. User sees different entity list (based on XYZ Ventures permissions)
```

---

## Summary

### Structure
1. **Organizations** (Settings) - Your teams
2. **Entities** (Main App) - Your portfolio companies, funds, etc.

### Navigation
```
Dashboard
  ├─ Entities ← NEW
  │   ├─ All Entities
  │   ├─ Create Entity
  │   └─ Entity Detail
  │       ├─ Overview
  │       ├─ Access Management
  │       ├─ Cap Table
  │       ├─ Portfolio
  │       └─ Deals
  ├─ Cap Table (filtered by active entity)
  ├─ Portfolio (filtered by active entity)
  └─ Settings
      ├─ Organizations (user memberships)
      ├─ Billing
      └─ Team Members
```

### Context Hierarchy
```
User
  → Organization (switcher in top bar)
    → Entity (switcher in top bar)
      → Entity Pages (cap table, portfolio, etc.)
```

### Key UX Principle
**Two-level context switching**:
1. **Organization context**: Who am I acting as?
2. **Entity context**: What am I working on?

Both visible in top bar at all times.

---

*This document should guide the frontend implementation of entity management.*
