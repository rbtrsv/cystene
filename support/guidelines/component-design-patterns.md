# React Component Design Patterns for CRUD Applications

## 1. File Naming Conventions

**Kebab-case naming is used consistently:**

### 1.1 Base Components
- `entity-action.tsx`
  - `company-list.tsx`
  - `company-detail.tsx`
  - `company-form.tsx`

### 1.2 Related Entity Components
- `entity-related-action.tsx`
  - `company-users.tsx` (main users management component)
  - `company-users-list.tsx` (subcomponent for displaying users)
  - `company-users-form.tsx` (subcomponent for adding/editing users)

## 2. Required Libraries

The following libraries are essential for implementing these patterns:

### 2.1 UI Components (shadcn/ui)
```tsx
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Input, Label, Select, Table, Badge, AlertDialog 
} from '@/modules/shadcnui/components/ui/[component-name]';
```

### 2.2 Form Handling (@tanstack/react-form)
```tsx
import { useForm } from '@tanstack/react-form';
```

### 2.3 Icons (lucide-react)
```tsx
import { Plus, Pencil, Trash2, Users, ArrowLeft, Save } from 'lucide-react';
```

### 2.4 Routing (Next.js App Router)
```tsx
import { useRouter } from 'next/navigation';
```

## 3. Core Component Types

### 3.1 List Component (`company-list.tsx`)
- Displays collection of entities in a table
- Includes search filtering  
- Provides tooltip-wrapped action buttons

### 3.2 Detail Component (`company-detail.tsx`)
- Shows detailed information about a single entity
- Contains action buttons (Edit, Delete, Manage Related)
- Uses grid layout for information display

### 3.3 Form Component (`company-form.tsx`)
- Handles both creation and editing via mode prop
- Uses TanStack React Form for validation
- Displays inline field errors

### 3.4 Related Entity Components
- **Main Component** (`company-users.tsx`): Manages the related entity relationship
- **List Component** (`company-users-list.tsx`): Displays related entities  
- **Form Component** (`company-users-form.tsx`): Adds/edits related entities

## 4. Component Structure Guidelines

**IMPORTANT: Detail components use Card wrapper, NOT fragment-based structure.**

All detail components follow a consistent Card-based structure:

```tsx
export default function EntityComponent({ /* props */ }: Props) {
  // Hooks, state, effects, handlers...
  
  // Conditional rendering for loading/error states with Card wrapper
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {/* Optional action buttons */}
      </CardHeader>
      
      <CardContent>
        {/* Main component content */}
        {/* For complex entities: nested Card sections */}
      </CardContent>
    </Card>
  );
}
```

**Note**: List and Form components still use fragment-based structure since the Card wrapper is provided at the page level.

## 5. Standard Component States

### 5.1 Loading State (Detail Components)

```tsx
if (isLoading) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Component Title</CardTitle>
        <CardDescription>Loading information...</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </CardContent>
    </Card>
  );
}
```

### 5.2 Error State (Detail Components)

```tsx
if (error) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Component Title</CardTitle>
        <CardDescription>Error loading data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          {error}
        </div>
        <Button onClick={clearError} className="mt-4">Try Again</Button>
      </CardContent>
    </Card>
  );
}
```

### 5.3 Loading/Error States for List/Form Components

List and Form components still use fragment-based structure:

```tsx
if (isLoading) {
  return (
    <>
      <CardHeader>
        <CardTitle>Component Title</CardTitle>
        <CardDescription>Loading information...</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </CardContent>
    </>
  );
}
```

## 6. Detail Component Patterns

There are **two main patterns** for detail components based on complexity:

### 6.1 Simple Detail Pattern
**Use for**: Entities with basic data (funds, stakeholders, rounds, companies)

**Features**:
- **Card wrapper** for the entire component
- Single CardContent with grid layout
- Basic field display

### 6.2 Complex Detail Pattern  
**Use for**: Entities with categorized/grouped data (transactions, securities, financial statements, revenue metrics)

**Features**:
- **Card wrapper** for the entire component  
- **Nested Card sections** for different categories
- Clean spacing with `space-y-6`
- Well-organized sections with clear headers

## 7. Implementation Examples

### 7.1 List Component (`company-list.tsx`)

Consistent patterns:
- Fragment-based root structure
- Header with title and "Add" button
- Search input with icon
- Table with consistent headers
- Tooltip-wrapped action icons

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanies } from '../../hooks/use-companies';
import { 
  CardHeader, CardTitle, CardDescription, CardContent 
} from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Table, TableHeader, TableRow, /* etc... */ } from '@/modules/shadcnui/components/ui/table';
import { AlertDialog, /* etc... */ } from '@/modules/shadcnui/components/ui/alert-dialog';
import { Tooltip, /* etc... */ } from '@/modules/shadcnui/components/ui/tooltip';
import { Pencil, Trash2, Eye, Users, Plus } from 'lucide-react';

export default function CompanyList() {
  const router = useRouter();
  const { companies, isLoading, error, fetchCompanies, removeCompany, clearError } = useCompanies();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [companyToDelete, setCompanyToDelete] = useState(null);
  
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);
  
  // Filter logic, event handlers, etc...

  // Loading and error states...
  
  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Companies</CardTitle>
          <CardDescription>Manage your companies</CardDescription>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Company
        </Button>
      </CardHeader>
      
      <CardContent>
        {/* Search input with icon */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <div className="absolute left-3 top-2.5 text-muted-foreground">
              <svg /* search icon */ />
            </div>
          </div>
        </div>
        
        {/* Table with action buttons */}
        <div className="rounded-md border">
          <Table>
            <TableCaption>/* Caption text */</TableCaption>
            <TableHeader>/* Header rows */</TableHeader>
            <TableBody>
              {filteredEntities.map((entity) => (
                <TableRow key={entity.id}>
                  {/* Table cells */}
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      {/* Action buttons with tooltips */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {/* More action buttons... */}
                      
                      {/* Delete confirmation dialog */}
                      <AlertDialog>
                        <AlertDialogTrigger>/* Delete button */</AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Entity</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this entity?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </>
  );
}
```

### 7.2 Simple Detail Component Pattern

**Use for**: Entities with basic data (funds, stakeholders, rounds, companies)

**Features**:
- **Card wrapper** for the entire component
- Single CardContent with grid layout
- Basic field display

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEntities } from '../../hooks/use-entities';
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent 
} from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { AlertDialog, /* etc... */ } from '@/modules/shadcnui/components/ui/alert-dialog';
import { Pencil, Trash2, Users } from 'lucide-react';

interface EntityDetailProps {
  id: number;
}

export default function EntityDetail({ id }: EntityDetailProps) {
  // Hooks, state, effects, handlers...
  
  // Loading, error, not found states...
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>{entity.name}</CardTitle>
          <CardDescription>
            Entity details and management
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleManageRelated}>
            <Users className="mr-2 h-4 w-4" /> Manage Related
          </Button>
          <Button variant="outline" onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <AlertDialog>
            {/* Delete confirmation dialog */}
          </AlertDialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Property Label</h3>
              <p className="text-base">{propertyValue}</p>
            </div>
            {/* More properties... */}
          </div>
          <div className="space-y-4">
            {/* More properties in second column... */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 7.3 Complex Detail Component Pattern

**Use for**: Entities with categorized/grouped data (transactions, securities, financial statements, revenue metrics)

**Features**:
- **Card wrapper** for the entire component  
- **Nested Card sections** for different categories
- Clean spacing with `space-y-6`
- Well-organized sections with clear headers

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEntities } from '../../hooks/use-entities';
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent 
} from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { AlertDialog, /* etc... */ } from '@/modules/shadcnui/components/ui/alert-dialog';
import { Pencil, Trash2 } from 'lucide-react';

// Helper component for dynamic field rendering
interface FieldProps {
  label: string;
  value: any;
  condition?: boolean;
  formatter?: (value: any) => React.ReactNode;
}

function DynamicField({ label, value, condition = true, formatter }: FieldProps) {
  // Don't render if condition is false or if value is null/undefined/empty
  if (!condition || value === null || value === undefined || value === '') {
    return null;
  }

  const displayValue = formatter ? formatter(value) : value;

  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <div className="text-base">{displayValue}</div>
    </div>
  );
}

export default function ComplexEntityDetail({ id }: EntityDetailProps) {
  // Hooks, state, effects, handlers...
  
  // Loading, error, not found states with Card wrapper...
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>{entity.name}</CardTitle>
          <CardDescription>
            {entity.type} | {entity.date}
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <AlertDialog>
            {/* Delete confirmation dialog */}
          </AlertDialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* General Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DynamicField label="Field 1" value={entity.field1} />
              <DynamicField label="Field 2" value={entity.field2} />
              <DynamicField label="Field 3" value={entity.field3} />
            </div>
          </CardContent>
        </Card>

        {/* Category 1 Section */}
        <Card>
          <CardHeader>
            <CardTitle>Category 1</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField 
                label="Amount" 
                value={entity.amount} 
                formatter={(value) => formatCurrency(value, 'USD')}
              />
              <DynamicField label="Description" value={entity.description} />
            </div>
          </CardContent>
        </Card>

        {/* Category 2 Section */}
        <Card>
          <CardHeader>
            <CardTitle>Category 2</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicField label="Field A" value={entity.fieldA} />
              <DynamicField label="Field B" value={entity.fieldB} />
            </div>
          </CardContent>
        </Card>

        {/* Metadata Section */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateField label="Created At" value={entity.createdAt} />
              <DateField label="Updated At" value={entity.updatedAt} />
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
```

### 7.4 Pattern Selection Guidelines

**Simple Pattern Use Cases**:
- Funds, Stakeholders, Rounds, Companies
- Basic entities with simple field display
- Minimal data categorization needed

**Complex Pattern Use Cases**:
- Transactions, Securities, Financial Statements, Revenue Metrics
- Entities with categorized/grouped data
- Multiple logical sections of information

### 7.5 Key Requirements for Both Patterns

1. **Always use Card wrapper** for the entire component
2. **Include Card wrapper in loading/error states** 
3. **Use consistent action button patterns** with TooltipProvider
4. **DynamicField helper** for conditional field rendering
5. **Proper spacing** with `space-y-6` for sections

## 8. Form Component Pattern (`company-form.tsx`)

### 8.1 Form Component Features
- TanStack React Form implementation
- Field rendering with validation
- Form submission handling
- Loading/saving state indicators

### 8.2 Form Component Implementation

```tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useCompanies } from '../../hooks/use-companies';
import { 
  CardHeader, CardTitle, CardDescription, CardContent 
} from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Save } from 'lucide-react';

// Helper function for field errors
function FieldInfo({ field }: { field: any }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <p className="text-sm text-destructive mt-1">{field.state.meta.errors.join(', ')}</p>
      ) : null}
      {field.state.meta.isValidating ? <p className="text-sm text-muted-foreground mt-1">Validating...</p> : null}
    </>
  );
}

interface EntityFormProps {
  id?: number;
  initialData?: Entity;
}

export default function EntityForm({ id, initialData }: EntityFormProps) {
  const router = useRouter();
  const { selectedEntity, addEntity, editEntity, fetchEntity, isLoading, error, clearError } = useEntity();
  
  const isEditMode = !!id;
  
  // Setup TanStack Form
  const form = useForm({
    defaultValues: initialData || selectedEntity || {
      // Default field values
    },
    onSubmit: async ({ value }) => {
      // Submit logic
    },
  });
  
  // Effects for fetching data, resetting form, etc.
  
  // Loading and error states...
  
  return (
    <>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Entity' : 'Create Entity'}</CardTitle>
        <CardDescription>
          {isEditMode ? 'Update entity details' : 'Add a new entity'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="space-y-6">
            <div className="space-y-4">
              {/* Form fields */}
              <div className="space-y-2">
                <form.Field
                  name="fieldName"
                  validators={{
                    onChange: ({ value }) => {
                      // Validation logic
                      return undefined;
                    }
                  }}
                >
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Field Label</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter value..."
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>
              
              {/* More form fields... */}
            </div>
            
            {/* Submit button with loading state */}
            <div className="flex justify-end mt-6">
              <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                {([canSubmit, isSubmitting]) => (
                  <Button type="submit" disabled={!canSubmit}>
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> 
                        {isEditMode ? 'Update Entity' : 'Create Entity'}
                      </>
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </div>
        </form>
      </CardContent>
    </>
  );
}
```

### 8.3 Form Button Sizing Standards

**IMPORTANT: Form buttons should use standard size, not large.**

```tsx
// ✅ Correct - Standard button size with CardFooter
<CardFooter className="flex justify-between">
  <Button type="button" variant="outline" onClick={() => router.back()}>
    Cancel
  </Button>
  <Button type="submit" disabled={!canSubmit || isSubmitting}>
    <Save className="mr-2 h-4 w-4" />
    {isEditMode ? 'Update Entity' : 'Create Entity'}
  </Button>
</CardFooter>

// ❌ Incorrect - Large button size with custom styling
<div className="flex justify-end px-6 pb-6">
  <Button type="submit" size="lg" className="px-8 py-2 text-base font-semibold" disabled={!canSubmit}>
    <Save className="mr-2 h-4 w-4" />
    {isEditMode ? 'Update Entity' : 'Create Entity'}
  </Button>
</div>
```

**Key Requirements**:
1. **Never use `size="lg"`** on form submit buttons
2. **Never use custom button styling** like `className="px-8 py-2 text-base font-semibold"`
3. **Always use CardFooter** instead of custom div containers
4. **Include Cancel button** for better UX
5. **Follow transaction form pattern** for consistency

## 9. Related Entity Component Pattern

The related entity pattern follows a hierarchical structure:

### 9.1 Main Component (`company-users.tsx`)
- Orchestrates the overall management of related entities
- Contains both list and form sub-components
- Handles state transitions between adding/editing/listing

### 9.2 List Component (`company-users-list.tsx`)
- Displays the related entities in a table view
- Provides action buttons for each related entity
- Receives handlers from the parent component

```tsx
export function CompanyUsersList({
  companyId,
  companyName,
  users,
  isLoading,
  error,
  onAddUser,
  onEditUser,
  onRemoveUser,
  onBack,
  onRefresh
}: CompanyUsersListProps) {
  const [userToRemove, setUserToRemove] = useState<CompanyUserWithProfile | null>(null);
  
  // Helper functions, handlers...
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Users for {companyName}</CardTitle>
        <CardDescription>Add, edit, or remove users from this company</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Add User Button */}
        <div className="flex justify-end">
          <Button onClick={onAddUser}>
            <UserPlus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </div>
        
        {/* Users Table */}
        <div className="rounded-md border">
          <Table>
            {/* Table content */}
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 9.3 Form Component (`company-users-form.tsx`)
- Presents form for adding/editing related entities
- Usually embedded within the main component
- Uses the same form patterns as entity forms

## 10. Common UI Patterns

### 10.1 Search Input with Icon

```tsx
<div className="relative flex-1">
  <Input
    placeholder="Search..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="pl-10"
  />
  <div className="absolute left-3 top-2.5 text-muted-foreground">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  </div>
</div>
```

### 10.2 Tooltip-Wrapped Action Buttons

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleAction(id)}
      >
        <Icon className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Action Description</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### 10.3 Confirmation Dialog

```tsx
<AlertDialog open={showDialog} onOpenChange={setShowDialog}>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">
      <Trash2 className="mr-2 h-4 w-4" /> Delete
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Entity</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete this entity? 
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleDelete}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 10.4 Form Field Pattern

```tsx
<form.Field
  name="fieldName"
  validators={{
    onChange: ({ value }) => {
      if (!value) return 'Field is required';
      // Additional validation...
      return undefined;
    }
  }}
>
  {(field) => (
    <div>
      <Label htmlFor={field.name}>Field Label</Label>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder="Enter value..."
      />
      <FieldInfo field={field} />
    </div>
  )}
</form.Field>
```

### 10.5 Two-Column Detail Layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div className="space-y-4">
    <div>
      <h3 className="text-sm font-medium text-muted-foreground">Property Label</h3>
      <p className="text-base">{propertyValue}</p>
    </div>
    {/* More properties... */}
  </div>
  <div className="space-y-4">
    {/* More properties in second column... */}
  </div>
</div>
```

## 11. Next.js 15 Page Components

### 11.1 Dynamic Route Pages with Async Params

**Important: Next.js 15 requires `params` to be typed as `Promise<T>` and awaited before use.**

### 11.2 Page Structure Guidelines

**CRITICAL: Pages should NEVER include Card wrappers or styling. Components handle their own Card structure.**

#### ✅ Correct Page Structure

```tsx
import { Metadata } from 'next';
import EntityList from '@/modules/assetmanager/components/entities/entity-list';

export const metadata: Metadata = {
  title: 'Entities',
  description: 'Manage entities and their details',
};

export default function EntitiesPage() {
  return <EntityList />;
}
```

#### ❌ Incorrect Page Structure

```tsx
// DON'T DO THIS - Pages should not have Card wrappers
export default function EntitiesPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="p-0">
          <EntityList />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 11.3 Single Parameter Pages (`[id]/page.tsx`)

```tsx
import { Metadata } from 'next';
import EntityDetail from '@/modules/assetmanager/components/entities/entity-detail';

export const metadata: Metadata = {
  title: 'Entity Details',
  description: 'View and manage entity details',
};

type EntityDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EntityDetailPage({ params }: EntityDetailPageProps) {
  const { id } = await params;
  const entityId = parseInt(id, 10);
  
  return <EntityDetail id={entityId} />;
}
```

### 11.4 Multiple Parameter Pages (`[id]/users/[userId]/edit/page.tsx`)

```tsx
import { Metadata } from 'next';
import EntityUsersForm from '@/modules/assetmanager/components/entities/entity-users-form';

export const metadata: Metadata = {
  title: 'Edit User Role',
  description: 'Update user role for this entity',
};

type EditUserRolePageProps = {
  params: Promise<{ id: string; userId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditUserRolePage({ params }: EditUserRolePageProps) {
  const { id, userId } = await params;
  const entityId = parseInt(id, 10);
  const userProfileId = parseInt(userId, 10);
  
  return (
    <EntityUsersForm 
      entityId={entityId} 
      userId={userProfileId}
      mode="edit"
    />
  );
}
```

### 11.5 Edit Pages (`[id]/edit/page.tsx`)

```tsx
import { Metadata } from 'next';
import EntityForm from '@/modules/assetmanager/components/entities/entity-form';

export const metadata: Metadata = {
  title: 'Edit Entity',
  description: 'Edit entity details',
};

type EditEntityPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditEntityPage({ params }: EditEntityPageProps) {
  const { id } = await params;
  const entityId = parseInt(id, 10);
  
  return <EntityForm id={entityId} />;
}
```

### 11.6 Create Pages with Parent Context (`[id]/children/new/page.tsx`)

```tsx
import { Metadata } from 'next';
import ChildEntityForm from '@/modules/assetmanager/components/entities/child-entity-form';

export const metadata: Metadata = {
  title: 'Add Child Entity',
  description: 'Add a new child entity to this parent',
};

type AddChildEntityPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AddChildEntityPage({ params }: AddChildEntityPageProps) {
  const { id } = await params;
  const parentId = parseInt(id, 10);
  
  return <ChildEntityForm parentId={parentId} />;
}
```

### 11.7 Key Requirements for Next.js 15 Pages

1. **NEVER include Card wrappers or styling in pages**
   ```tsx
   // ✅ Correct - Page directly returns component
   export default function Page() {
     return <EntityList />;
   }
   
   // ❌ Incorrect - Pages should not have Card wrappers
   export default function Page() {
     return (
       <div className="flex flex-col gap-8">
         <Card>
           <CardContent className="p-0">
             <EntityList />
           </CardContent>
         </Card>
       </div>
     );
   }
   ```

2. **Always type `params` as `Promise<T>`**
   ```tsx
   // ✅ Correct
   params: Promise<{ id: string }>
   
   // ❌ Incorrect (will cause TypeScript build errors)
   params: Promise<{ id: string }> | { id: string }
   params: { id: string }
   ```

3. **Always await `params` before use**
   ```tsx
   // ✅ Correct
   const { id } = await params;
   
   // ❌ Incorrect
   const resolvedParams = 'then' in params ? await params : params;
   const { id } = resolvedParams;
   ```

4. **Include `searchParams` type for consistency**
   ```tsx
   searchParams?: Promise<Record<string, string | string[] | undefined>>;
   ```

5. **Use appropriate parameter destructuring**
   ```tsx
   // Single param
   const { id } = await params;
   
   // Multiple params
   const { id, userId } = await params;
   const { id, roundId } = await params;
   ```

6. **Convert string IDs to numbers when needed**
   ```tsx
   const entityId = parseInt(id, 10);
   ```

### 11.8 Why Pages Should Not Have Card Wrappers

**Separation of Concerns**:
- **Pages**: Handle routing, parameter parsing, and metadata only
- **Components**: Handle UI structure, styling, and business logic

**Flexibility**:
- Components can decide their own Card structure and spacing
- Different components may need different wrapper patterns
- Easier to reuse components in different contexts

**Consistency**:
- Follows the pattern used by financial statements (income-statements, balance-sheets, cash-flow-statements)
- Cleaner, more maintainable code
- Reduces duplication of wrapper code

**Examples of Correct Implementation**:
- `/dashboard/income-statements/page.tsx` → `<IncomeStatementList />`
- `/dashboard/balance-sheets/[id]/page.tsx` → `<BalanceSheetDetail id={id} />`
- `/dashboard/performance-metrics/page.tsx` → `<PerformanceMetricsSummary />`

### 11.9 Common Page Types

- **List Pages**: `page.tsx` - View all entities
- **Detail Pages**: `[id]/page.tsx` - View entity details
- **Edit Pages**: `[id]/edit/page.tsx` - Edit existing entity
- **Create Pages**: `new/page.tsx` or `[id]/children/new/page.tsx` - Create new entity
- **Related Entity Pages**: `[id]/users/page.tsx` - Manage related entities
- **Nested Edit Pages**: `[id]/users/[userId]/edit/page.tsx` - Edit relationships

## 12. Common Build Issues and Solutions

### 12.1 ESLint: Unescaped Entities in JSX

**Problem**: ESLint error `react/no-unescaped-entities` when using apostrophes in JSX text.

**Example Error**:
```
Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
```

**Solution**: Always escape apostrophes and quotes in JSX text content:

```tsx
// ❌ Incorrect - causes ESLint error
<Label htmlFor={field.name}>Total Shareholders' Equity</Label>

// ✅ Correct - escaped apostrophe
<Label htmlFor={field.name}>Total Shareholders&apos; Equity</Label>
```

**Common Characters to Escape**:
- `'` → `&apos;` (apostrophe)
- `"` → `&quot;` (double quote)  
- `<` → `&lt;` (less than)
- `>` → `&gt;` (greater than)
- `&` → `&amp;` (ampersand)

### 12.2 TypeScript: Invalid Button/Badge Variants

**Problem**: TypeScript build errors for invalid shadcn/ui component variants.

**Example Error**:
```
Type '"outline-solid"' is not assignable to type '"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"'
```

**Solution**: Use only valid variants defined in shadcn/ui components:

```tsx
// ❌ Incorrect - "outline-solid" is not a valid variant
<Button variant="outline-solid">Click me</Button>
<Badge variant="outline-solid">Status</Badge>

// ✅ Correct - use "outline" instead
<Button variant="outline">Click me</Button>
<Badge variant="outline">Status</Badge>
```

**Valid Button Variants**:
- `"default"` | `"destructive"` | `"outline"` | `"secondary"` | `"ghost"` | `"link"`

**Valid Badge Variants**:
- `"default"` | `"secondary"` | `"destructive"` | `"outline"`

**Quick Fix**: Replace all `"outline-solid"` with `"outline"` across the codebase.

### 12.3 Prevention Tips

1. **Use TypeScript**: Enable strict type checking to catch invalid variants early
2. **ESLint Configuration**: Ensure `react/no-unescaped-entities` rule is enabled
3. **Code Review**: Check for unescaped characters in JSX text content
4. **Component Documentation**: Refer to shadcn/ui docs for valid variant options