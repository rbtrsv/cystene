import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/modules/shadcnui/components/ui/alert';

/**
 * Access Denied component
 * Displays a permission denied message when user doesn't have access to a page
 */
export function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You do not have permission to access this page.
        </AlertDescription>
      </Alert>
    </div>
  );
}
