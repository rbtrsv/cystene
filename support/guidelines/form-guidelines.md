# Form Component Guidelines

## Mandatory Form Structure

**For COMPLEX forms with multiple sections, use this NESTED CARD structure:**

### **Advanced Pattern (Use for Complex Financial Forms):**

```tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useEntity } from '@/modules/hooks/use-entity';
import { CreateEntitySchema, UpdateEntitySchema, type Entity } from '@/modules/schemas/entity.schemas';

// TanStack Form setup with FORM-LEVEL validation for complex business logic
const form = useForm({
  defaultValues: {
    // Use STRINGS for number fields in complex forms
    amount: initialData?.amount?.toString() || '',
    year: initialData?.year?.toString() || currentYear.toString(),
    // Use actual types for non-numbers
    companyId: initialData?.companyId || undefined,
    status: initialData?.status || 'Active',
  },
  
  // FORM-LEVEL validation for complex business rules
  validators: {
    onChange: ({ value }) => {
      // Transform strings to proper types for schema validation
      const transformedValue = {
        amount: value.amount ? Number(value.amount) : undefined,
        year: value.year ? Number(value.year) : undefined,
        companyId: value.companyId,
        status: value.status,
      };
      
      const schema = isEditMode ? UpdateEntitySchema : CreateEntitySchema;
      const result = schema.safeParse(transformedValue);
      
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        return fieldErrors;
      }
      return undefined;
    },
  },
  
  onSubmit: async ({ value }) => {
    // Transform and validate at submission
    const transformedValue = {
      amount: value.amount ? Number(value.amount) : undefined,
      year: value.year ? Number(value.year) : undefined,
      companyId: value.companyId,
      status: value.status,
    };
    
    const schema = isEditMode ? UpdateEntitySchema : CreateEntitySchema;
    const result = schema.parse(transformedValue);
    
    const success = isEditMode 
      ? await editEntity(id!, result)
      : await addEntity(result);
      
    if (success) {
      router.push(isEditMode ? `/entities/${id}` : '/entities');
    }
  },
});

// For number fields in complex forms, use simple onChange
<Input
  type="number"
  step="0.01"
  value={field.state.value || ''}
  onChange={(e) => field.handleChange(e.target.value)}
/>
```

### **Basic Pattern (Use for Simple Forms):**

```tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useEntity } from '@/modules/hooks/use-entity';
import { CreateEntitySchema, UpdateEntitySchema, type Entity } from '@/modules/schemas/entity.schemas';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Save } from 'lucide-react';

interface EntityFormProps {
  id?: number;
  initialData?: Entity;
}

// MANDATORY: Use this EXACT FieldInfo component in every form
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

export default function EntityForm({ id, initialData }: EntityFormProps) {
  const router = useRouter();
  const { selectedEntity, addEntity, editEntity, fetchEntity, isLoading, error, clearError } = useEntity();
  
  const isEditMode = !!id;
  
  const form = useForm({
    defaultValues: {
      // Initialize ALL fields here
    },
    onSubmit: async ({ value }) => {
      const schema = isEditMode ? UpdateEntitySchema : CreateEntitySchema;
      const result = schema.parse(value);
      
      const success = isEditMode 
        ? await editEntity(id!, result)
        : await addEntity(result);
        
      if (success) {
        router.push(isEditMode ? `/entities/${id}` : '/entities');
      }
    },
  });
  
  useEffect(() => {
    if (isEditMode && id && !initialData) fetchEntity(id);
  }, [isEditMode, id, initialData, fetchEntity]);
  
  useEffect(() => {
    if (selectedEntity && isEditMode) {
      form.reset({
        // Reset ALL fields here
      });
    }
  }, [selectedEntity, isEditMode, form]);

  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Entity' : 'Create Entity'}</CardTitle>
          <CardDescription>Loading entity information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Entity' : 'Create Entity'}</CardTitle>
          <CardDescription>Error loading entity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </>
    );
  }
  
  return (
    <Card className="max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {isEditMode ? 'Edit Entity' : 'Create Entity'}
        </CardTitle>
        <CardDescription>
          {isEditMode ? 'Update entity details' : 'Add a new entity'}
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}>
        <CardContent className="space-y-4 p-3 md:p-4">
          
          {/* Section 1 */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Section Title</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                
                {/* FIELDS GO HERE */}
                
              </div>
            </CardContent>
          </Card>
          
          {/* Section 2 */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Another Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              
              {/* MORE FIELDS GO HERE */}
              
            </CardContent>
          </Card>

        </CardContent>
        
        {/* Submit Button */}
        <div className="flex justify-end px-6 pb-6">
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" size="lg" className="px-8 py-2 text-base font-semibold" disabled={!canSubmit}>
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
      </form>
    </Card>
  );
}
```

**For SIMPLE forms with few fields, use this BASIC structure:**

```tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useEntity } from '@/modules/hooks/use-entity';
import { CreateEntitySchema, UpdateEntitySchema, type Entity } from '@/modules/schemas/entity.schemas';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Save } from 'lucide-react';

interface EntityFormProps {
  id?: number;
  initialData?: Entity;
}

// MANDATORY: Use this EXACT FieldInfo component in every form
function FieldInfo({ field }: { field: any }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <p className="text-sm text-destructive mt-1">{field.state.meta.errors.join(', ')}</p>
      ) : null}
      {field.state.meta.isValidating ? (
        <p className="text-sm text-muted-foreground mt-1">Validating...</p>
      ) : null}
    </>
  );
}

export default function EntityForm({ id, initialData }: EntityFormProps) {
  const router = useRouter();
  const { selectedEntity, addEntity, editEntity, fetchEntity, isLoading, error, clearError } = useEntity();
  
  const isEditMode = !!id;
  
  const form = useForm({
    defaultValues: {
      // Initialize ALL fields here
    },
    validators: {
      onChange: ({ value }) => {
        const schema = isEditMode ? UpdateEntitySchema : CreateEntitySchema;
        const result = schema.safeParse(value);
        
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path.length > 0) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          return fieldErrors;
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      const schema = isEditMode ? UpdateEntitySchema : CreateEntitySchema;
      const result = schema.parse(value);
      
      const success = isEditMode 
        ? await editEntity(id!, result)
        : await addEntity(result);
        
      if (success) {
        router.push(isEditMode ? `/entities/${id}` : '/entities');
      }
    },
  });
  
  useEffect(() => {
    if (isEditMode && id && !initialData) fetchEntity(id);
  }, [isEditMode, id, initialData, fetchEntity]);
  
  useEffect(() => {
    if (selectedEntity && isEditMode) {
      form.reset({
        // Reset ALL fields here
      });
    }
  }, [selectedEntity, isEditMode, form]);

  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Entity' : 'Create Entity'}</CardTitle>
          <CardDescription>Loading entity information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Entity' : 'Create Entity'}</CardTitle>
          <CardDescription>Error loading entity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </>
    );
  }
  
  return (
    <>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Entity' : 'Create Entity'}</CardTitle>
        <CardDescription>
          {isEditMode ? 'Update entity details' : 'Add a new entity'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          e.stopPropagation(); 
          form.handleSubmit(); 
        }}>
          <div className="space-y-6">
            <div className="space-y-4">
              
              {/* FIELDS GO HERE */}

            </div>

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

---

## Field Type Patterns

### STRING FIELD (Required)

**Use for: names, titles, descriptions, codes**

```tsx
<div className="space-y-2">
  <form.Field
    name="fieldName"
    validators={{
      onChange: ({ value }) => {
        if (!value || typeof value !== 'string') return 'Field name is required';
        if (value.trim().length < 2) return 'Field name must be at least 2 characters';
        if (value.length > 100) return 'Field name is too long';
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
          placeholder="Enter field value"
        />
        <FieldInfo field={field} />
      </div>
    )}
  </form.Field>
</div>
```

### STRING FIELD (Optional)

**Use for: optional descriptions, notes, comments**

```tsx
<div className="space-y-2">
  <form.Field
    name="fieldName"
    validators={{
      onChange: ({ value }) => {
        if (value && value.length > 500) return 'Field is too long';
        return undefined;
      }
    }}
  >
    {(field) => (
      <div>
        <Label htmlFor={field.name}>Field Label (Optional)</Label>
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value || ''}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder="Enter field value"
        />
        <FieldInfo field={field} />
      </div>
    )}
  </form.Field>
</div>
```

### TEXTAREA FIELD

**Use for: long descriptions, notes, addresses**

```tsx
<div className="space-y-2">
  <form.Field
    name="fieldName"
    validators={{
      onChange: ({ value }) => {
        if (value && value.length > 1000) return 'Field is too long';
        return undefined;
      }
    }}
  >
    {(field) => (
      <div>
        <Label htmlFor={field.name}>Field Label</Label>
        <Textarea
          id={field.name}
          name={field.name}
          value={field.state.value || ''}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder="Enter field value"
          rows={3}
        />
        <FieldInfo field={field} />
      </div>
    )}
  </form.Field>
</div>
```

### NUMBER FIELD (Required)

**Use for: amounts, quantities, counts, IDs**

```tsx
<div className="space-y-2">
  <form.Field
    name="fieldName"
    validators={{
      onChange: ({ value }) => {
        if (!value) return 'Field is required';
        const numValue = Number(value);
        if (isNaN(numValue)) return 'Field must be a number';
        if (numValue <= 0) return 'Field must be positive';
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
          type="number"
          step="0.01"
          value={field.state.value || ''}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.valueAsNumber)}
          placeholder="Enter amount"
        />
        <FieldInfo field={field} />
      </div>
    )}
  </form.Field>
</div>
```

### NUMBER FIELD (Optional)

**Use for: optional amounts, optional quantities**

```tsx
<div className="space-y-2">
  <form.Field
    name="fieldName"
    validators={{
      onChange: ({ value }) => {
        if (value !== undefined && value !== null) {
          const numValue = Number(value);
          if (isNaN(numValue)) return 'Field must be a number';
          if (numValue < 0) return 'Field cannot be negative';
        }
        return undefined;
      }
    }}
  >
    {(field) => (
      <div>
        <Label htmlFor={field.name}>Field Label (Optional)</Label>
        <Input
          id={field.name}
          name={field.name}
          type="number"
          step="0.01"
          value={field.state.value || ''}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value ? e.target.valueAsNumber : undefined)}
          placeholder="Enter amount"
        />
        <FieldInfo field={field} />
      </div>
    )}
  </form.Field>
</div>
```

### INTEGER FIELD

**Use for: years, counts, IDs, quantities that must be whole numbers**

```tsx
<div className="space-y-2">
  <form.Field
    name="fieldName"
    validators={{
      onChange: ({ value }) => {
        if (!value) return 'Field is required';
        const numValue = Number(value);
        if (isNaN(numValue)) return 'Field must be a number';
        if (!Number.isInteger(numValue)) return 'Field must be a whole number';
        if (numValue <= 0) return 'Field must be positive';
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
          type="number"
          step="1"
          value={field.state.value || ''}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(Number(e.target.value))}
          placeholder="Enter number"
        />
        <FieldInfo field={field} />
      </div>
    )}
  </form.Field>
</div>
```

### YEAR FIELD

**Use for: vintage years, birth years, establishment years**

```tsx
<div className="space-y-2">
  <form.Field
    name="vintage"
    validators={{
      onChange: ({ value }) => {
        if (!value) return 'Year is required';
        const numValue = Number(value);
        if (isNaN(numValue)) return 'Year must be a number';
        const currentYear = new Date().getFullYear();
        if (numValue < 1900 || numValue > currentYear + 10) return 'Invalid year';
        return undefined;
      }
    }}
  >
    {(field) => (
      <div>
        <Label htmlFor={field.name}>Year</Label>
        <Input
          id={field.name}
          name={field.name}
          type="number"
          step="1"
          value={field.state.value || ''}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder="Enter year"
        />
        <FieldInfo field={field} />
      </div>
    )}
  </form.Field>
</div>
```

### PERCENTAGE FIELD

**Use for: ownership percentages, rates, interest rates**

```tsx
<div className="space-y-2">
  <form.Field
    name="percentage"
    validators={{
      onChange: ({ value }) => {
        if (value !== undefined && value !== null) {
          const numValue = Number(value);
          if (isNaN(numValue)) return 'Percentage must be a number';
          if (numValue < 0 || numValue > 100) return 'Percentage must be between 0 and 100';
        }
        return undefined;
      }
    }}
  >
    {(field) => (
      <div>
        <Label htmlFor={field.name}>Percentage (%)</Label>
        <Input
          id={field.name}
          name={field.name}
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={field.state.value || ''}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : undefined)}
          placeholder="Enter percentage"
        />
        <FieldInfo field={field} />
      </div>
    )}
  </form.Field>
</div>
```

### DATE FIELD

**Use for: transaction dates, birth dates, event dates**

```tsx
<div className="space-y-2">
  <form.Field
    name="date"
    validators={{
      onChange: ({ value }) => {
        if (!value) return 'Date is required';
        if (isNaN(new Date(value).getTime())) return 'Invalid date';
        return undefined;
      }
    }}
  >
    {(field) => (
      <div>
        <Label htmlFor={field.name}>Date</Label>
        <Input
          id={field.name}
          name={field.name}
          type="date"
          value={field.state.value instanceof Date 
            ? field.state.value.toISOString().split('T')[0] 
            : field.state.value || ''}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value ? new Date(e.target.value) : null)}
        />
        <FieldInfo field={field} />
      </div>
    )}
  </form.Field>
</div>
```

### DATE FIELD (String Format)

**Use for: when backend expects string dates**

```tsx
<div className="space-y-2">
  <form.Field
    name="date"
    validators={{
      onChange: ({ value }) => {
        if (!value) return 'Date is required';
        if (isNaN(new Date(value).getTime())) return 'Invalid date';
        return undefined;
      }
    }}
  >
    {(field) => (
      <div>
        <Label htmlFor={field.name}>Date</Label>
        <Input
          id={field.name}
          name={field.name}
          type="date"
          value={field.state.value || ''}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
        />
        <FieldInfo field={field} />
      </div>
    )}
  </form.Field>
</div>
```

### SELECT FIELD (From Enum)

**Use for: status fields, type fields, category fields**

```tsx
<div className="space-y-2">
  <form.Field
    name="status"
    validators={{
      onChange: ({ value }) => {
        if (!value) return 'Status is required';
        if (!statusEnum.options.includes(value)) return 'Invalid status';
        return undefined;
      }
    }}
  >
    {(field) => (
      <div>
        <Label htmlFor={field.name}>Status</Label>
        <Select 
          value={field.state.value} 
          onValueChange={(value) => field.handleChange(value)}
        >
          <SelectTrigger id={field.name}>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statusEnum.options.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldInfo field={field} />
      </div>
    )}
  </form.Field>
</div>
```

### SELECT FIELD (From Entity List)

**Use for: company selection, fund selection, round selection**

```tsx
<div className="space-y-2">
  <form.Field
    name="entityId"
    validators={{
      onChange: ({ value }) => {
        if (!value || value === 0) return 'Entity is required';
        return undefined;
      }
    }}
  >
    {(field) => (
      <div>
        <Label htmlFor={field.name}>Entity</Label>
        <Select
          value={field.state.value?.toString() || ''}
          onValueChange={(value) => field.handleChange(parseInt(value, 10))}
        >
          <SelectTrigger id={field.name}>
            <SelectValue placeholder="Select entity" />
          </SelectTrigger>
          <SelectContent>
            {entities.map((entity) => (
              <SelectItem key={entity.id} value={entity.id!.toString()}>
                {entity.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldInfo field={field} />
      </div>
    )}
  </form.Field>
</div>
```

### EMAIL FIELD

**Use for: email addresses**

```tsx
<div className="space-y-2">
  <form.Field
    name="email"
    validators={{
      onChange: ({ value }) => {
        if (!value) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Invalid email format';
        return undefined;
      }
    }}
  >
    {(field) => (
      <div>
        <Label htmlFor={field.name}>Email</Label>
        <Input
          id={field.name}
          name={field.name}
          type="email"
          value={field.state.value || ''}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder="Enter email address"
        />
        <FieldInfo field={field} />
      </div>
    )}
  </form.Field>
</div>
```

### URL FIELD

**Use for: website URLs, social media links**

```tsx
<div className="space-y-2">
  <form.Field
    name="website"
    validators={{
      onChange: ({ value }) => {
        if (value && typeof value === 'string') {
          if (!/^https?:\/\/.*/.test(value)) {
            return 'Website must be a valid URL starting with http:// or https://';
          }
        }
        return undefined;
      }
    }}
  >
    {(field) => (
      <div>
        <Label htmlFor={field.name}>Website</Label>
        <Input
          id={field.name}
          name={field.name}
          type="url"
          value={field.state.value || ''}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder="https://example.com"
        />
        <FieldInfo field={field} />
      </div>
    )}
  </form.Field>
</div>
```

### CHECKBOX FIELD

**Use for: boolean flags, agreements, enable/disable options**

```tsx
<div className="space-y-2">
  <form.Field name="includeInIrr">
    {(field) => (
      <div className="flex items-center space-x-2">
        <Checkbox
          id={field.name}
          checked={field.state.value || false}
          onCheckedChange={(checked) => field.handleChange(!!checked)}
        />
        <Label htmlFor={field.name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Include in IRR calculation
        </Label>
        <FieldInfo field={field} />
      </div>
    )}
  </form.Field>
</div>
```

### MULTI-SELECT FIELD

**Use for: tags, categories, multiple selections**

```tsx
<div className="space-y-2">
  <form.Field
    name="tags"
    validators={{
      onChange: ({ value }) => {
        if (value && value.length > 10) return 'Too many tags selected';
        return undefined;
      }
    }}
  >
    {(field) => (
      <div>
        <Label htmlFor={field.name}>Tags</Label>
        <MultiSelect
          value={field.state.value || []}
          onValueChange={(value) => field.handleChange(value)}
          placeholder="Select tags"
        >
          {availableTags.map((tag) => (
            <MultiSelectItem key={tag.id} value={tag.id}>
              {tag.name}
            </MultiSelectItem>
          ))}
        </MultiSelect>
        <FieldInfo field={field} />
      </div>
    )}
  </form.Field>
</div>
```

---

## Field Layout Patterns

### SINGLE FIELD

```tsx
<div className="space-y-2">
  <form.Field name="fieldName">
    {/* field implementation */}
  </form.Field>
</div>
```

### TWO COLUMN LAYOUT

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div className="space-y-2">
    <form.Field name="field1">
      {/* field implementation */}
    </form.Field>
  </div>
  <div className="space-y-2">
    <form.Field name="field2">
      {/* field implementation */}
    </form.Field>
  </div>
</div>
```

### THREE COLUMN LAYOUT

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="space-y-2">
    <form.Field name="field1">
      {/* field implementation */}
    </form.Field>
  </div>
  <div className="space-y-2">
    <form.Field name="field2">
      {/* field implementation */}
    </form.Field>
  </div>
  <div className="space-y-2">
    <form.Field name="field3">
      {/* field implementation */}
    </form.Field>
  </div>
</div>
```

### FULL WIDTH FIELD

```tsx
<div className="space-y-2">
  <form.Field name="description">
    {(field) => (
      <div>
        <Label htmlFor={field.name}>Description</Label>
        <Textarea
          id={field.name}
          name={field.name}
          value={field.state.value || ''}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder="Enter description"
          rows={4}
          className="w-full"
        />
        <FieldInfo field={field} />
      </div>
    )}
  </form.Field>
</div>
```

### SECTION WITH HEADER

```tsx
<div className="space-y-4">
  <h3 className="text-lg font-semibold">Section Title</h3>
  <div className="space-y-2">
    <form.Field name="field1">
      {/* field implementation */}
    </form.Field>
  </div>
  <div className="space-y-2">
    <form.Field name="field2">
      {/* field implementation */}
    </form.Field>
  </div>
</div>
```

---

## Form Default Values Pattern

### BASIC DEFAULT VALUES

```tsx
defaultValues: {
  name: initialData?.name || selectedEntity?.name || '',
  description: initialData?.description || selectedEntity?.description || '',
  amount: initialData?.amount || selectedEntity?.amount || 0,
  date: initialData?.date || selectedEntity?.date || new Date().toISOString().split('T')[0],
  status: initialData?.status || selectedEntity?.status || 'Active',
  isActive: initialData?.isActive || selectedEntity?.isActive || false,
  entityId: initialData?.entityId || selectedEntity?.entityId || undefined,
}
```

### FORM RESET PATTERN

```tsx
useEffect(() => {
  if (selectedEntity && isEditMode) {
    form.reset({
      name: selectedEntity.name || '',
      description: selectedEntity.description || '',
      amount: selectedEntity.amount || 0,
      date: selectedEntity.date || new Date().toISOString().split('T')[0],
      status: selectedEntity.status || 'Active',
      isActive: selectedEntity.isActive || false,
      entityId: selectedEntity.entityId || undefined,
    });
  }
}, [selectedEntity, isEditMode, form]);
```

---

## Forbidden Patterns

### ❌ DO NOT USE SecurityValidator

```tsx
// ❌ NEVER DO THIS
import { SecurityValidator } from '@/modules/security/validators';
onChange={(e) => field.handleChange(SecurityValidator.cleanInput(e.target.value, 100))}
```

### ❌ DO NOT Create Individual Field Schemas

```tsx
// ❌ NEVER DO THIS
const NameSchema = z.string().min(2);
const AmountSchema = z.number().positive();
```

### ❌ DO NOT Use Inline Validation Without Field-Level Validators

```tsx
// ❌ NEVER DO THIS
<Input
  onChange={(e) => {
    if (e.target.value.length < 2) {
      setError('Too short');
    }
    field.handleChange(e.target.value);
  }}
/>
```

### ❌ DO NOT Skip Accessibility Attributes

```tsx
// ❌ NEVER DO THIS
<Label>Name</Label>
<Input name="name" />

// ✅ ALWAYS DO THIS
<Label htmlFor={field.name}>Name</Label>
<Input id={field.name} name={field.name} />
```

---

## Mandatory File Naming

- Forms: `entity-form.tsx` (kebab-case)
- Hooks: `use-entity.ts` (kebab-case)
- Schemas: `entity.schemas.ts` (kebab-case)

---

## Mandatory Imports

```tsx
// ALWAYS import these in every form
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useEntity } from '@/modules/hooks/use-entity';
import { CreateEntitySchema, UpdateEntitySchema, type Entity } from '@/modules/schemas/entity.schemas';

// NEVER import these
// import { SecurityValidator } from '@/modules/security/validators'; ❌
```

---

## Form Submission Pattern

**EVERY form MUST use this EXACT onSubmit pattern:**

```tsx
onSubmit: async ({ value }) => {
  const schema = isEditMode ? UpdateEntitySchema : CreateEntitySchema;
  const result = schema.parse(value);
  
  const success = isEditMode 
    ? await editEntity(id!, result)
    : await addEntity(result);
    
  if (success) {
    router.push(isEditMode ? `/entities/${id}` : '/entities');
  }
},
```

---

## Submit Button Pattern

**EVERY form MUST use this EXACT submit button:**

```tsx
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
```

---

## Data Type Mapping

| Data Type | Field Pattern | Validation | Default Value |
|-----------|---------------|------------|---------------|
| `string` (required) | STRING FIELD (Required) | `!value \|\| value.length < 2` | `''` |
| `string` (optional) | STRING FIELD (Optional) | `value && value.length > 500` | `''` |
| `string` (long) | TEXTAREA FIELD | `value && value.length > 1000` | `''` |
| `number` (required) | NUMBER FIELD (Required) | `!value \|\| isNaN(Number(value))` | `0` |
| `number` (optional) | NUMBER FIELD (Optional) | `value && isNaN(Number(value))` | `undefined` |
| `integer` | INTEGER FIELD | `!Number.isInteger(numValue)` | `0` |
| `year` | YEAR FIELD | `numValue < 1900 \|\| numValue > currentYear + 10` | `currentYear` |
| `percentage` | PERCENTAGE FIELD | `numValue < 0 \|\| numValue > 100` | `undefined` |
| `Date` | DATE FIELD | `isNaN(new Date(value).getTime())` | `new Date().toISOString().split('T')[0]` |
| `string` (date) | DATE FIELD (String Format) | `isNaN(new Date(value).getTime())` | `''` |
| `enum` | SELECT FIELD (From Enum) | `!enumOptions.includes(value)` | `enumOptions[0]` |
| `number` (ID) | SELECT FIELD (From Entity List) | `!value \|\| value === 0` | `undefined` |
| `email` | EMAIL FIELD | `!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)` | `''` |
| `url` | URL FIELD | `!/^https?:\/\/.*/.test(value)` | `''` |
| `boolean` | CHECKBOX FIELD | No validation needed | `false` |
| `array` | MULTI-SELECT FIELD | `value && value.length > 10` | `[]` |
