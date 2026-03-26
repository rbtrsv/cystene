# Code Comments Guide

## Overview

This guide establishes standardized commenting patterns for both Python (Django) and TypeScript codebases. The system uses 3 levels but Level 2 should be used sparingly - only when truly needed.

## 3-Level Comment System

### **Level 1: Major Sections (Always use for file organization)**
```python
# ==========================================
# Financial Statements
# ==========================================
```

```typescript
// ==========================================
// Financial Statements
// ==========================================
```

### **Level 2: Subsections (Use sparingly - only when needed)**
```python
# Revenue Section
# ===============
```

```typescript
// Revenue Section
// ===============
```

### **Level 3: Inline Comments (Use when helpful)**
```python
# Transform API response to client format
# Calculate total revenue for the period
```

```typescript
// Transform API response to client format
// Calculate total revenue for the period
```

## When to Use Each Level

### **Level 1 - Major Sections (Always)**
- Different model groups
- Different functional areas
- Major feature boundaries
- API endpoint groups
- Service classes

### **Level 2 - Subsections (Only when truly needed)**

**✅ Use Level 2 when:**
- File has 100+ lines with distinct functional areas
- Clear logical separation exists (CRUD operations, helper methods)
- Multiple developers work on the same file
- Complex TypeScript services with clear functional groupings

**❌ Don't use Level 2 when:**
- File is straightforward and short
- Only one logical area exists
- It would create visual clutter
- **Django models** (use simple inline comments instead)
- Simple components or services

### **Level 3 - Inline Comments (When helpful)**
- Single line explanations
- Variable clarifications
- Complex logic explanations
- Quick notes and reminders
- **Django model fields** (when clarification needed)

## Python (Django) Examples

### **Django Models (Clean Pattern - No Level 2)**
```python
# =============================================================================
# CORE MODELS
# =============================================================================

class Entity(models.Model):
    """
    Core model representing any financial entity (company or fund).
    - Can be a traditional company or a fund
    - Can raise money from other entities
    - Can invest in other entities
    """
    
    name = models.CharField(max_length=255)
    entity_type = models.CharField(max_length=20, choices=EntityTypes.choices)
    # Self-referencing for parent-child relationships
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE)
    current_valuation = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    cash_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_entity_type_display()})"
    
    def calculate_nav(self):
        """Calculate NAV based on assets and financials."""
        # Start with cash balance
        nav = self.cash_balance
        for asset in self.assets.all():
            latest_financials = asset.financial_statements.order_by('-statement_date').first()
            if latest_financials:
                nav += latest_financials.total_assets - latest_financials.total_liabilities
        return nav

# =============================================================================
# FINANCIAL STATEMENTS
# =============================================================================

class IncomeStatement(models.Model):
    """Profit & Loss (P&L) Statement."""
    
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE)
    statement_date = models.DateField()
    revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    cost_of_goods_sold = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    # Operating expenses breakdown
    research_and_development = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    sales_general_admin = models.DecimalField(max_digits=15, decimal_places=2, default=0)
```

### **Django Views (Minimal commenting)**
```python
# =============================================================================
# SECURITY VIEWS
# =============================================================================

class SecurityListView(ListView):
    """List all securities for the current user."""
    model = Security
    
    def get_queryset(self):
        # Filter securities by user permissions
        return Security.objects.filter(user=self.request.user)
```

## TypeScript Examples

### **Complex TypeScript Service (Level 2 when needed)**
```typescript
// =============================================================================
// ORGANIZATIONS SERVICE
// =============================================================================

export class OrganizationsService {
  
  // API ENDPOINTS
  // =============
  private readonly baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  private readonly endpoints = {
    list: '/organizations/',
    create: '/organizations/',
    update: (id: number) => `/organizations/${id}/`
  };
  
  // CRUD OPERATIONS
  // ===============
  
  async getOrganizations(): Promise<OrganizationsResponse> {
    // Fetch all organizations for current user
    const url = `${this.baseUrl}${this.endpoints.list}`;
    return await fetchClient<OrganizationsResponse>(url);
  }
  
  async createOrganization(data: CreateOrgInput): Promise<OrgResponse> {
    // Create new organization with validation
    const url = `${this.baseUrl}${this.endpoints.create}`;
    return await fetchClient<OrgResponse>(url, {
      method: 'POST',
      body: data
    });
  }
  
  // HELPER METHODS
  // ==============
  
  private transformOrganization(org: ApiOrganization): Organization {
    // Transform API response to client format
    return {
      id: org.id,
      name: org.name
    };
  }
}
```

### **Simple Component (No Level 2)**
```typescript
// =============================================================================
// ORGANIZATION LIST COMPONENT
// =============================================================================

export default function OrganizationList() {
  const { organizations, isLoading, error, fetchOrganizations } = useOrganizations();
  
  useEffect(() => {
    // Load organizations on component mount
    fetchOrganizations();
  }, [fetchOrganizations]);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {organizations.map((org) => (
        <div key={org.id}>
          {/* Organization card display */}
          <h3>{org.name}</h3>
        </div>
      ))}
    </div>
  );
}
```

### **React Hook (Minimal commenting)**
```typescript
// =============================================================================
// USE ORGANIZATIONS HOOK
// =============================================================================

export function useOrganizations() {
  const { organizations, selectedOrg, isLoading, error } = useOrganizationsContext();
  const { addOrg, editOrg, removeOrg } = useOrganizationsStore();
  
  return {
    organizations,
    selectedOrg,
    isLoading,
    error,
    // Expose all CRUD operations
    addOrg,
    editOrg,
    removeOrg
  };
}
```

## Best Practices

### **Do:**
- Use Level 1 for major file sections
- Use Level 2 only when file complexity demands it (primarily TypeScript services)
- Keep inline comments concise and helpful
- Use JSDoc/docstrings for function documentation
- **Django models**: Use simple inline comments only
- Be consistent within each file

### **Don't:**
- Overuse Level 2 subsections
- Add comments that just repeat the code
- Use Level 2 in Django models (use simple inline comments)
- Use Level 2 in simple, short files
- Mix commenting styles within the same file
- Add unnecessary comments for obvious code

## File Type Guidelines

### **Django Models:**
- **Level 1**: Model groups only
- **Level 3**: Simple inline comments for field clarification
- **Never Level 2**: Keep models clean and readable

### **TypeScript Services:**
- **Level 1**: Service sections
- **Level 2**: When file has 100+ lines with clear functional groupings
- **Level 3**: Inline explanations

### **React Components:**
- **Level 1**: Component sections
- **Level 3**: Inline comments only
- **Rarely Level 2**: Most components are too simple

## File Size Guidelines

- **< 50 lines**: Level 1 + Level 3 only
- **50-100 lines**: Consider Level 2 only for complex TypeScript services
- **> 100 lines**: Level 2 appropriate for TypeScript services with clear sections
- **Django models**: Always Level 1 + Level 3 regardless of size

## Remember

**Simple is better than complex.** Most files should only use Level 1 and Level 3 comments. Level 2 is for when you genuinely need better organization in complex files.