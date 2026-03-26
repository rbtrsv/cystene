# Asset Manager Permissions Guide

**🚨 CRITICAL: Database model file determines access permissions. This is NON-NEGOTIABLE.**

## User Types & Access

| User Type | Access | Permissions |
|-----------|--------|-------------|
| **ADMIN** | Everything | CRUD |
| **EDITOR** | Everything | CRU (no DELETE) |
| **VIEWER** | Everything | R (VIEW only) |
| **Company User** | ONLY companies.ts entities | Companies: RU, Financials: CRU (filtered by their companies) |
| **Stakeholder User** | ONLY portfolio.ts + captable.ts entities | R (filtered by their stakeholders) |

## Entity Classification by Database Model

**🚨 RULE: Database model file location = Access permission**

### 📁 companies.ts → Company Users + Global Users
**Complete Entity List**: `companies`, `companyUsers`, `incomeStatements`, `cashFlowStatements`, `balanceSheets`, `financialRatios`, `revenueMetrics`, `customerMetrics`, `operationalMetrics`, `teamMetrics`, `kpis`, `kpiValues`
- ✅ Company Users: CRU access (filtered to their companies)
- ✅ Global Users: CRUD access (all companies)
- ❌ Stakeholder Users: NO ACCESS

### 📁 portfolio.ts → ONLY Global Users + Stakeholder Users  
**Complete Entity List**: `dealPipeline`, `investmentPortfolio`, `portfolioCashFlow`, `portfolioPerformance`
- ❌ Company Users: ABSOLUTELY NO ACCESS
- ✅ Stakeholder Users: R access (broad access, not investment-restricted)
- ✅ Global Users: CRUD access

### 📁 captable.ts → ONLY Global Users + Stakeholder Users
**Complete Entity List**: `stakeholders`, `stakeholderUsers`, `funds`, `rounds`, `securities`, `transactions`, `feeCosts`, `capTableEntries`
- ❌ Company Users: ABSOLUTELY NO ACCESS  
- ✅ Stakeholder Users: R access (filtered by their fund relationships)
- ✅ Global Users: CRUD access

## Adding New Entity

### Step 1: Add to EntityModel enum
```typescript
export enum EntityModel {
  NEW_ENTITY = 'new_entity'
}
```

### Step 2: If stakeholder-related, add to StakeholderEntityModel
```typescript
// Only for portfolio.ts or captable.ts entities
export enum StakeholderEntityModel {
  NEW_ENTITY = 'new_entity'
}
```

### Step 3: Implement Server Action with correct filtering
```typescript
// FOR COMPANIES.TS ENTITIES
export async function getCompanyEntity(): Promise<EntityResponse> {
  return withAuth(async (profile) => {
    // Check permission
    const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
    if (!allowed) {
      return { success: false, error: 'Insufficient permissions' };
    }
    
    // Use getCompanyIds() for companies.ts entities
    const companyIds = await getCompanyIds(profile);
    
    let result;
    if (companyIds.length > 0) {
      result = await db.select().from(table).where(inArray(table.companyId, companyIds));
    } else {
      result = await db.select().from(table); // Global users - no filter
    }
    
    return { success: true, data: result };
  });
}

// FOR PORTFOLIO.TS OR CAPTABLE.TS ENTITIES
export async function getStakeholderEntity(): Promise<EntityResponse> {
  return withAuth(async (profile) => {
    // Check permission
    const allowed = await hasPermission(profile, Action.VIEW, EntityModel.DEAL_PIPELINE);
    if (!allowed) {
      return { success: false, error: 'Insufficient permissions' };
    }
    
    // Use getStakeholderIds() for portfolio.ts/captable.ts entities
    const stakeholderIds = await getStakeholderIds(profile);
    
    let result;
    if (stakeholderIds.length > 0) {
      result = await db.select().from(table).where(inArray(table.companyId, stakeholderIds));
    } else {
      result = await db.select().from(table); // Global users - no filter
    }
    
    return { success: true, data: result };
  });
}
```

## Key Rules

- **🚨 Database model file location = Access permission** (NON-NEGOTIABLE)
- **Company users can ONLY access companies.ts entities**
- **Stakeholder users can ONLY access portfolio.ts + captable.ts entities**
- **Global users**: No filtering, full access based on role
- **NEVER question the model structure** - if it's in portfolio.ts or captable.ts, company users have NO ACCESS
- **Stakeholder users get broad access** to portfolio/captable data (not restricted by specific investments)
- Always use `withAuth()` and `hasPermission()` in server actions
- Apply data filtering after permission checks pass

## Permission Examples

```typescript
// Company user permissions:
hasPermission(profile, Action.VIEW, EntityModel.COMPANIES) // ✅ true
hasPermission(profile, Action.UPDATE, EntityModel.COMPANIES) // ✅ true
hasPermission(profile, Action.CREATE, EntityModel.COMPANIES) // ❌ false  
hasPermission(profile, Action.DELETE, EntityModel.COMPANIES) // ❌ false
hasPermission(profile, Action.CREATE, EntityModel.COMPANIES_FINANCIALS) // ✅ true
hasPermission(profile, Action.UPDATE, EntityModel.COMPANIES_FINANCIALS) // ✅ true
hasPermission(profile, Action.DELETE, EntityModel.COMPANIES_FINANCIALS) // ❌ false

// Stakeholder user permissions:
hasPermission(profile, Action.VIEW, EntityModel.DEAL_PIPELINE) // ✅ true
hasPermission(profile, Action.CREATE, EntityModel.DEAL_PIPELINE) // ❌ false
hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS) // ❌ false
```

## Common Mistakes to Avoid

- ❌ Assuming company users can access portfolio data because it has `companyId`
- ❌ Restricting stakeholder access based on specific investments
- ❌ Using wrong filtering function based on entity relationships rather than model file location
- ❌ Questioning why stakeholders can see all deal pipeline data (this is the business requirement)
- ❌ Forgetting to add new entities to permission enums
- ❌ Using getCompanyIds() for portfolio/captable entities
- ❌ Using getStakeholderIds() for companies entities