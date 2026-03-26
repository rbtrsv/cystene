# Organization & Subscription UX Proposal

**Date**: 2025-10-12
**Context**: Determining optimal UX pattern for organization management and subscription billing

---

## Current Implementation Analysis

### ✅ What Exists
1. **Sidebar** (`app-sidebar.tsx`):
   - User dropdown in footer with "Billing & Settings" option
   - Routes to `/dashboard/settings/billing`
2. **Billing Page** (`/dashboard/settings/billing/page.tsx`):
   - Shows current subscription status
   - Stripe customer portal integration
   - Organization info display
3. **User Dropdown Menu**:
   - Profile
   - Billing & Settings
   - Theme toggle
   - Logout

### ❌ What's Missing
- **Organization switcher** (multi-org support exists in backend but no UI)
- **Organization settings page** (create/edit/delete organizations)
- **Team members management** (invitations exist in backend)
- **Entity-level access control UI**

---

## UX Pattern Analysis

### Pattern 1: Settings Under User Dropdown (Current Implementation)
```
User Avatar (Footer) → Dropdown Menu
├─ Profile
├─ Billing & Settings ← Current location
├─ Dark/Light Mode
└─ Logout
```

**Pros**:
- Simple, familiar pattern (GitHub, Notion)
- User-centric ("my settings")
- Good for single-user or single-org scenarios

**Cons**:
- Doesn't scale well for multi-organization
- Mixing user settings with org/billing settings
- No clear organization context

---

### Pattern 2: Separate Settings Area (Recommended ⭐)
```
Sidebar Navigation
├─ Overview
│   ├─ Dashboard
│   └─ Analytics
├─ Cap Table
│   └─ ... (existing)
├─ Portfolio
│   └─ ... (existing)
├─ Settings (NEW)
│   ├─ Organizations
│   ├─ Billing & Subscription
│   ├─ Team Members
│   └─ User Profile
└─ User Avatar (Footer)
    ├─ Switch Organization ← NEW
    ├─ Dark/Light Mode
    └─ Logout
```

**Pros**:
- Clear separation: User vs Organization settings
- Scalable for multi-organization
- Industry standard (Stripe, Vercel, Linear)
- Dedicated space for organization management

**Cons**:
- Requires more navigation items
- Slightly more complex

---

### Pattern 3: Top Bar Organization Switcher (Enterprise Pattern)
```
Top Bar (Header):
[Organization Dropdown] [Settings Icon] [User Avatar]

Organization Dropdown:
├─ ABC Capital ✓ (current)
├─ XYZ Ventures
├─ Create New Organization
└─ Organization Settings

Settings Icon:
├─ Billing
├─ Team Members
└─ Integrations

User Avatar:
├─ Profile
├─ Dark Mode
└─ Logout
```

**Pros**:
- Most explicit multi-organization UX
- Always visible organization context
- Used by: Vercel, Supabase, Railway

**Cons**:
- Takes header space
- More UI elements to manage

---

## Recommended Implementation: **Pattern 2 + Pattern 3 Hybrid**

### Structure

#### **Sidebar** (Main Navigation)
```
┌─────────────────────────┐
│ [Finpy Logo]            │
├─────────────────────────┤
│ 📊 Overview             │
│   • Dashboard           │
│   • Analytics           │
├─────────────────────────┤
│ 💼 Cap Table            │
│ 📈 Portfolio            │
│ 📁 Dealflow             │
│ 💰 Fund Admin           │
│ 📊 Investor Reporting   │
│ 🏢 Companies            │
├─────────────────────────┤
│ ⚙️  Settings (NEW)      │
│   • Organizations       │
│   • Billing             │
│   • Team Members        │
│   • User Profile        │
├─────────────────────────┤
│ [User Avatar]           │
│  John Doe               │
│  john@abc.com           │
│  • Switch Org           │
│  • Theme Toggle         │
│  • Logout               │
└─────────────────────────┘
```

#### **Top Bar** (Organization Context)
```
┌───────────────────────────────────────────────────────────┐
│ [☰] / Dashboard                 [ABC Capital ▼]  [Avatar] │
└───────────────────────────────────────────────────────────┘
```

Organization Dropdown Shows:
```
ABC Capital (Owner) ✓
──────────────────
XYZ Ventures (Viewer)
──────────────────
+ Create Organization
⚙️  Organization Settings → routes to /dashboard/settings/organizations
```

---

## Detailed Page Structure

### `/dashboard/settings` (New Layout)

```
Settings
├─ /dashboard/settings/organizations
│   ├─ List all organizations user belongs to
│   ├─ Create new organization button
│   ├─ Edit organization name
│   ├─ Leave organization (if not owner)
│   ├─ Delete organization (owner only)
│   └─ View role in each organization
│
├─ /dashboard/settings/billing
│   ├─ Current subscription (existing)
│   ├─ Organization billing contact
│   ├─ Stripe portal link
│   ├─ Invoice history
│   └─ Usage metrics (future)
│
├─ /dashboard/settings/team
│   ├─ List organization members
│   ├─ Invite new members (email + role)
│   ├─ Pending invitations
│   ├─ Change member roles (OWNER/ADMIN/EDITOR/VIEWER)
│   └─ Remove members (ADMIN+ only)
│
└─ /dashboard/settings/profile
    ├─ User email, name
    ├─ Password change
    ├─ Email verification
    ├─ Delete account
    └─ API keys (future)
```

---

## Implementation Phases

### Phase 1: Move Billing to Settings Section ✅
- [x] Keep existing `/dashboard/settings/billing` page
- [ ] Add "Settings" group to sidebar
- [ ] Move "Billing" under Settings group
- [ ] Update navigation structure

**Code Changes**:
```tsx
// app-sidebar.tsx - Add after Companies section
<SidebarSeparator />

<SidebarGroup>
  <SidebarGroupLabel>Settings</SidebarGroupLabel>
  <SidebarGroupContent>
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/dashboard/settings/billing")}>
          <a href="/dashboard/settings/billing">
            <CreditCard className="h-4 w-4" />
            <span>Billing</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroupContent>
</SidebarGroup>
```

### Phase 2: Add Organizations Page
- [ ] Create `/dashboard/settings/organizations/page.tsx`
- [ ] List all organizations
- [ ] Show user's role in each
- [ ] "Create Organization" button
- [ ] Edit/Delete organization actions

**API Requirements**:
- `GET /accounts/organizations/` - Already exists ✅
- `POST /accounts/organizations/` - Already exists ✅
- `PUT /accounts/organizations/{id}` - Already exists ✅
- `DELETE /accounts/organizations/{id}` - Already exists ✅

### Phase 3: Add Organization Switcher
- [ ] Add organization dropdown to top bar
- [ ] Store active organization in localStorage or context
- [ ] Filter entities by selected organization
- [ ] Show organization name in breadcrumb

**State Management**:
```typescript
// Zustand store or Context
interface OrganizationStore {
  activeOrganizationId: number | null
  organizations: Organization[]
  setActiveOrganization: (id: number) => void
}

// Usage in entity queries
const { activeOrganizationId } = useOrganizationStore()
const entities = useQuery('/entities', {
  params: { organization_id: activeOrganizationId }
})
```

### Phase 4: Add Team Members Page
- [ ] Create `/dashboard/settings/team/page.tsx`
- [ ] List organization members with roles
- [ ] Invite new members (email + role dropdown)
- [ ] Show pending invitations
- [ ] Change member roles
- [ ] Remove members

**API Requirements**:
- `GET /accounts/organizations/{id}/members` - Need to create
- `POST /accounts/invitations/` - Already exists ✅
- `GET /accounts/invitations/` - Already exists ✅
- `PUT /accounts/organizations/{id}/members/{member_id}` - Need to create
- `DELETE /accounts/organizations/{id}/members/{member_id}` - Need to create

### Phase 5: Add User Profile Page
- [ ] Create `/dashboard/settings/profile/page.tsx`
- [ ] Update user name/email
- [ ] Change password
- [ ] Email verification status
- [ ] Delete account option

---

## User Dropdown Simplification

After moving settings to sidebar, user dropdown becomes:

```
User Avatar (Footer)
├─ ABC Capital ✓ (current org)    ← Organization switcher
├─ XYZ Ventures
├─────────────────
├─ ⚙️  Go to Settings              ← Quick link to /dashboard/settings
├─────────────────
├─ 🌙 Dark Mode                    ← Theme toggle
└─ 🚪 Logout
```

---

## Benefits of This Approach

### For Single Organization Users
- Simple: Settings in sidebar, billing in one place
- No confusion about "organization" concept if they only have one

### For Multi Organization Users
- Clear organization context in top bar
- Easy switching between organizations
- Separate settings per organization (billing, team)

### For Teams
- Invite members directly from settings
- Role management in dedicated page
- Clear organization ownership

### For Billing
- Organization-scoped billing (one subscription per org)
- Clear who pays (organization owner)
- Stripe portal for payment management

---

## Migration Path for Existing Users

1. **Keep existing route**: `/dashboard/settings/billing` still works
2. **Add sidebar link**: "Settings → Billing" in sidebar
3. **Deprecate user dropdown link**: Eventually remove "Billing & Settings" from user dropdown
4. **Add organization switcher**: Gradual rollout, default to first organization
5. **Prompt multi-org users**: Show tooltip "You belong to multiple organizations, click here to switch"

---

## Visual Mockup (Text-based)

### Before (Current)
```
┌─────────────────────────────────────┐
│ Sidebar                             │
├─────────────────────────────────────┤
│ Overview                            │
│ Cap Table                           │
│ Portfolio                           │
│ ... (all sections)                  │
├─────────────────────────────────────┤
│ [Avatar] John Doe                   │
│   • Profile                         │
│   • Billing & Settings ← Only here  │
│   • Dark Mode                       │
│   • Logout                          │
└─────────────────────────────────────┘
```

### After (Proposed)
```
┌─────────────────────────────────────┐
│ [☰] Dashboard    [ABC Capital ▼]   │ ← Top bar with org switcher
├─────────────────────────────────────┤
│ Sidebar                             │
├─────────────────────────────────────┤
│ Overview                            │
│ Cap Table                           │
│ Portfolio                           │
│ ... (all sections)                  │
├─────────────────────────────────────┤
│ ⚙️  Settings                        │ ← New section
│   • Organizations                   │
│   • Billing                         │
│   • Team Members                    │
│   • User Profile                    │
├─────────────────────────────────────┤
│ [Avatar] John Doe                   │
│   • ABC Capital ✓                   │ ← Quick org switcher
│   • XYZ Ventures                    │
│   ─────────────                     │
│   • Go to Settings                  │
│   • Dark Mode                       │
│   • Logout                          │
└─────────────────────────────────────┘
```

---

## Recommendation Summary

**Short Answer**: Add "Settings" section to sidebar with 4 sub-pages:
1. Organizations
2. Billing (move existing page here)
3. Team Members
4. User Profile

**Why**:
- Scales for multi-organization
- Clear separation of concerns
- Industry standard pattern
- Keeps user dropdown simple
- Supports existing billing page

**Next Steps**:
1. Update temporary-memory-tasks.md with these UX tasks
2. Start with Phase 1 (move billing to settings section)
3. Build Phase 2 (organizations page) once Phase 1 is done
4. Add organization switcher (Phase 3) when multi-org becomes important

---

*This document should be used as reference for frontend UX implementation.*
